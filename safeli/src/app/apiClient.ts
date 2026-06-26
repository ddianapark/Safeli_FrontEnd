import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { tokenStorage } from '../services/tokenStorage';
import { AuthTokens } from '../types/auth.types';
import { BASE_URL } from '../constants/config';

// ─── Force-logout event bus ───────────────────────────────────────────────────
// apiClient vive fuera del árbol de React, así que no puede llamar directamente
// al AuthContext. Usamos un simple event emitter para desacoplarlo.
type Listener = () => void;
const forceLogoutListeners: Listener[] = [];

export const authEvents = {
  onForceLogout(listener: Listener): () => void {
    forceLogoutListeners.push(listener);
    return () => {
      const index = forceLogoutListeners.indexOf(listener);
      if (index > -1) forceLogoutListeners.splice(index, 1);
    };
  },
  emitForceLogout(): void {
    forceLogoutListeners.forEach((listener) => listener());
  },
};

// ─── Token refresh queue ──────────────────────────────────────────────────────
interface FailedRequest {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedRequestsQueue.forEach((req) => {
    if (error) req.reject(error);
    else req.resolve(token as string);
  });
  failedRequestsQueue = [];
};

// Decodifica el payload del JWT para leer `exp` (sin verificar firma).
function parseJwt(token: string): { exp?: number } {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    let json = '';
    if (typeof globalThis.atob === 'function') {
      json = globalThis.atob(b64);
    } else if (typeof Buffer !== 'undefined') {
      // @ts-ignore
      json = Buffer.from(b64, 'base64').toString('utf8');
    } else {
      return {};
    }
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

// Serializa múltiples refreshes concurrentes con una cola.
async function refreshWithQueue(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedRequestsQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    let response;

    if (refreshToken) {
      response = await axios.post<AuthTokens>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
      );
    } else {
      // Refresh vía HttpOnly cookie (si el backend lo soporta)
      response = await axios.post<AuthTokens>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
    }

    const { accessToken: newAccess, refreshToken: newRefresh } = response.data;

    if (newRefresh) {
      await tokenStorage.saveTokens(newAccess, newRefresh);
    } else {
      await tokenStorage.saveTokens(newAccess);
    }

    processQueue(null, newAccess);
    return newAccess;
  } catch (refreshError) {
    processQueue(refreshError, null);
    await tokenStorage.clearTokens();
    await tokenStorage.clearRememberMe();
    authEvents.emitForceLogout();
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
// Adjunta el Bearer token en cada request.
// Si el token vence en menos de 60 s, lo refresca de forma proactiva.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let accessToken = await tokenStorage.getAccessToken();

    if (accessToken) {
      const { exp = 0 } = parseJwt(accessToken);
      const secsLeft = exp - Math.floor(Date.now() / 1000);
      if (secsLeft < 60) {
        try {
          accessToken = await refreshWithQueue();
        } catch {
          // Si falla el refresh proactivo dejamos pasar; el interceptor de
          // respuesta (401) hará el segundo intento.
        }
      }
    }

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────────────
// Si el backend devuelve 401 (token vencido en el servidor) reintenta una vez
// con un nuevo token.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshWithQueue();
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(original);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;