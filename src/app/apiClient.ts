import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from '../constants/config';
import { tokenStorage } from '../services/tokenStorage';

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
      // Only emit force logout if the refresh endpoint actually rejected the token (401/403)
      // A 404 means the endpoint doesn't exist — don't log the user out for that
      const axiosErr = err as AxiosError;
      const status = axiosErr?.response?.status;
      if (status === 401 || status === 403) {
        authEvents.emitForceLogout();
      }
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
      try {
        const { exp = 0 } = parseJwt(accessToken);
        const secsLeft = exp - Math.floor(Date.now() / 1000);

        // Solo refrescar si el token tiene expiración válida y está por vencer
        if (exp > 0 && secsLeft < 60) {
          try {
            accessToken = await refreshWithQueue();
          } catch {
            // Si el refresh falla, continuar con el token actual
          }
        }
      } catch {
        // Si no se puede parsear el token (ej: token fijo de dev), continuar sin refresh
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

    if (error.response?.status === 401 && !original._retry) {
        // Do not attempt refresh for auth routes (login/register/refresh)
        const url = original.url ?? '';
        if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        original._retry = true;
      try {
        const newToken = await refreshWithQueue();
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(original); 
      } catch (refreshError) {
        // Only force logout if the refresh itself returned 401/403, not a network/404 error
        const refreshAxiosError = refreshError as AxiosError;
        const refreshStatus = refreshAxiosError?.response?.status;
        if (refreshStatus === 401 || refreshStatus === 403 || !refreshAxiosError?.response) {
          await tokenStorage.clearTokens();
          await tokenStorage.clearUser();
          authEvents.emitForceLogout();
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;