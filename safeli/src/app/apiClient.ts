import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { tokenStorage } from '../services/tokenStorage';
import { AuthTokens } from '../types/auth.types';

const BASE_URL = 'https://api.safeli.com';

// ─── Force-logout event bus ───────────────────────────────────────────────────
// apiClient vive fuera del árbol de React, así que no puede llamar directamente
// al AuthContext. Usamos un simple event emitter para desacoplarlo.
// El AuthContext se suscribe a este evento y ejecuta el logout.
type Listener = () => void;
const forceLogoutListeners: Listener[] = [];

export const authEvents = {
  onForceLogout(listener: Listener): () => void {
    forceLogoutListeners.push(listener);
    // Devuelve una función de cleanup para usarla en useEffect
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
  resolve: (value: string | null) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedRequestsQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token);
    }
  });
  failedRequestsQueue = [];
};

// ─── Axios instance ───────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        await tokenStorage.saveTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        await tokenStorage.clearRememberMe();
        // ← Notifica al AuthContext para que limpie el estado y redirija al login
        authEvents.emitForceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;