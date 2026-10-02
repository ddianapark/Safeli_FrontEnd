import { request } from './apiClient';
import { LatLng, PlaceSuggestion, RouteResult } from './googleApi';
import { RutaSegura } from './safeliApi';

export const api = {
  // =========================================================================
  // AUTENTICACIÓN & USUARIOS
  // =========================================================================
  auth: {
    login: (credentials: { email: string; pass: string }) => 
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        requiresAuth: false,
      }),

    register: (userData: any) => 
      request<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        requiresAuth: false,
      }),

    verifyCode: (email: string, code: string) =>
      request('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
        requiresAuth: false,
      }),

    changePassword: (data: { currentPass: string; newPass: string }) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // =========================================================================
  // SAFELI API (Rutas Seguras y Feedback)
  // =========================================================================
  safeli: {
    obtenerCaminoSeguro: (origin: LatLng, destination: LatLng) =>
      request<RutaSegura>('/routes/safe', {
        method: 'POST',
        body: JSON.stringify({ origin, destination }),
      }),

    enviarFeedback: (feedbackData: { rating: number; comentario: string; resumenViaje: any }) =>
      request('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      }),
  },

  // =========================================================================
  // GOOGLE MAPS / ORS (Geocodificación y Ruta Rápida)
  // =========================================================================
  google: {
    getRouteORS: (origin: LatLng, destination: LatLng) =>
      request<RouteResult>('/routes/ors', {
        method: 'POST',
        body: JSON.stringify({ origin, destination }),
        requiresAuth: false,
      }),

    geocodeAddress: (address: string) =>
      request<LatLng | null>(`/geocode?address=${encodeURIComponent(address)}`, {
        requiresAuth: false,
      }),

    reverseGeocode: (lat: number, lng: number) =>
      request<string>(`/geocode/reverse?lat=${lat}&lng=${lng}`, {
        requiresAuth: false,
      }),

    getPlaceSuggestions: (text: string) =>
      request<PlaceSuggestion[]>(`/places/autocomplete?query=${encodeURIComponent(text)}`, {
        requiresAuth: false,
      }),
  },
};