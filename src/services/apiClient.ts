import axios, { AxiosError } from 'axios';
import { tokenStorage } from './tokenStorage';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://safeli-api.vercel.app';

// Eventos de sesión: el AuthProvider se suscribe para desloguear ante un 401
export const authEvents = {
  listeners: [] as Array<() => void>,
  onForceLogout(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  },
  emitForceLogout() {
    this.listeners.forEach((cb) => cb());
  },
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Adjuntar Bearer Token en cada solicitud
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error al obtener token para la petición:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Sesión expirada (401): forzar logout, salvo en login/registro
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const url = error.config?.url ?? '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      console.warn('Sesión expirada o no autorizada (401). Emitiendo ForceLogout.');
      authEvents.emitForceLogout();
    }

    return Promise.reject(error);
  }
);

// Helper estilo fetch usado por services/api.ts
interface RequestOptions {
  method?: string;
  body?: string;
  requiresAuth?: boolean;
}

export async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  // requiresAuth se ignora: el interceptor adjunta el token si existe, y es inocuo en rutas públicas
  const { method = 'GET', body } = options;
  const response = await apiClient.request<T>({
    url: path,
    method,
    data: body ? JSON.parse(body) : undefined,
  });
  return response.data;
}

export default apiClient;
