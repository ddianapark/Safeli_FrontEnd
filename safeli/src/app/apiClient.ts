import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { tokenStorage } from '../services/tokenStorage';
import { AuthTokens } from '../types/auth.types';
import { BASE_URL } from '../constants/config';

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

interface FailedRequest {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedRequestsQueue.forEach((req) => {
    if (error) req.reject(error);
    else req.resolve(token!);
  });
  failedRequestsQueue = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper decodificador rápido de JWT
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

// Lógica de petición de Refresh pasándole el token por Header customizado
async function refreshWithQueue(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedRequestsQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  const currentRefreshToken = await tokenStorage.getRefreshToken();

  if (!currentRefreshToken) {
    isRefreshing = false;
    throw new Error('No refresh token storage found');
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Mandamos el Refresh Token via Headers tal como pide tu flujo
      const response = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            'x-refresh-token': currentRefreshToken,
          },
        }
      );

      const { accessToken, refreshToken } = response.data;
      await tokenStorage.saveTokens(accessToken, refreshToken);

      processQueue(null, accessToken);
      resolve(accessToken);
    } catch (err) {
      processQueue(err, null);
      authEvents.emitForceLogout(); // Si falla el Refresh -> Expulsión al Login
      reject(err);
    } finally {
      isRefreshing = false;
    }
  });
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let accessToken = await tokenStorage.getAccessToken();

    if (accessToken) {
      const { exp = 0 } = parseJwt(accessToken);
      const secsLeft = exp - Math.floor(Date.now() / 1000);
      
      // Si está a menos de 60 segundos de vencer hacemos refresh preventivo
      if (secsLeft < 60) {
        try {
          accessToken = await refreshWithQueue();
        } catch {
          // Si falla de manera asíncrona, dejamos que prosiga para que lo capture el interceptor 401
        }
      }
    }

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si el servidor responde 401 Unauthorized (JWT Expirado en ruta protegida)
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshWithQueue();
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(original); // Reintenta petición original con el nuevo JWT
      } catch (refreshError) {
        // Si el refresh token también expiró, eliminamos credenciales locales
        await tokenStorage.clearTokens();
        await tokenStorage.clearUser();
        authEvents.emitForceLogout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;