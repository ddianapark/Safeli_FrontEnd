import axios, { AxiosError } from 'axios';
import { tokenStorage } from '../services/tokenStorage';

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

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// 1. Interceptor de Petición: Inyecta el Token de forma automática a todas las rutas
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

// 2. Interceptor de Respuesta: Control de Deslogueo
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Solo deslogueamos si el 401 NO viene del intento de login/registro
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      console.warn('Sesión expirada o no autorizada (401). Emitiendo ForceLogout.');
      
      // Opcional: podrías verificar si el error realmente exige desloguear
      authEvents.emitForceLogout();
    }

    return Promise.reject(error);
  }
);

export default apiClient;