import type { LatLng, PlaceSuggestion, RouteResult, RutaSegura } from '../types/route_types';
import { apiClient } from './apiClient';

export type { LatLng, PlaceSuggestion, RouteResult, RutaSegura } from '../types/route_types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await apiClient.request<T>({
    url: endpoint,
    method,
    data: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
  });

  return response.data;
}

export const api = {
  // =========================================================================
  // AUTENTICACIÓN & USUARIOS
  // =========================================================================
  auth: {
    login: (credentials: { email: string; pass: string }) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: credentials,
      }),

    register: (userData: any) =>
      request<{ message: string }>('/auth/register', {
        method: 'POST',
        body: userData,
      }),

    verifyCode: (email: string, code: string) =>
      request('/auth/verify-code', {
        method: 'POST',
        body: { email, code },
      }),

    changePassword: (data: { currentPass: string; newPass: string }) =>
      request('/auth/change-password', {
        method: 'POST',
        body: data,
      }),
  },

  // =========================================================================
  // SAFELI API (Rutas Seguras y Feedback)
  // =========================================================================
  safeli: {
    obtenerCaminoSeguro: (origin: LatLng, destination: LatLng) =>
      request<RutaSegura>('/routes/safe', {
        method: 'POST',
        body: { origin, destination },
      }),

    // TODO: el backend todavía no expone un endpoint de feedback (responde 404)
    enviarFeedback: (feedbackData: { rating: number; comentario: string; resumenViaje: any }) =>
      request('/feedback', {
        method: 'POST',
        body: feedbackData,
      }),
  },

  // =========================================================================
  // GOOGLE MAPS / ORS (Geocodificación y Ruta Rápida)
  // =========================================================================
  google: {
    getRouteORS: (origin: LatLng, destination: LatLng) =>
      request<RouteResult>('/routes/ors', {
        method: 'POST',
        body: { origin, destination },
      }),

    geocodeAddress: (address: string) =>
      request<LatLng | null>(`/geocode?address=${encodeURIComponent(address)}`),

    reverseGeocode: (lat: number, lng: number) =>
      request<string>(`/geocode/reverse?lat=${lat}&lng=${lng}`),

    getPlaceSuggestions: (text: string) =>
      request<PlaceSuggestion[]>(`/places/autocomplete?query=${encodeURIComponent(text)}`),
  },
};
