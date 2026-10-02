import axios from 'axios';
import { tokenStorage } from '../context/authContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tu-backend-safeli.vercel.app/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjuntar Bearer Token en cada solicitud
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Manejo automático de sesión expirada (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          await tokenStorage.clearTokens();
          return Promise.reject(error);
        }

        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, newRefreshToken } = res.data;

        await tokenStorage.saveTokens(accessToken, newRefreshToken || refreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);