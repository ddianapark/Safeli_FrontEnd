import { Platform } from 'react-native';
import { request } from './apiClient';
import type { LatLng, PlaceSuggestion, RouteResult, RutaSegura } from '../types/route_types';

// =========================================================================
// HELPERS: Google (mobile) / Nominatim (web, sin CORS ni API key)
// =========================================================================
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? '';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const GOOGLE_MAPS_URL = 'https://maps.googleapis.com/maps/api';
const useGoogle = Platform.OS !== 'web' && !!GOOGLE_API_KEY;

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error en fetch externo:', error);
    return null;
  }
}

async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (useGoogle) {
    const data = await getJson(
      `${GOOGLE_MAPS_URL}/geocode/json?address=${encodeURIComponent(address)}&language=es&region=ar&key=${GOOGLE_API_KEY}`
    );
    const loc = data?.status === 'OK' ? data.results?.[0]?.geometry?.location : null;
    return loc ? { latitude: loc.lat, longitude: loc.lng } : null;
  }

  const data = await getJson(
    `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ar&accept-language=es`
  );
  const item = data?.[0];
  return item ? { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) } : null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (useGoogle) {
    const data = await getJson(
      `${GOOGLE_MAPS_URL}/geocode/json?latlng=${lat},${lng}&language=es&key=${GOOGLE_API_KEY}`
    );
    return data?.status === 'OK' ? data.results?.[0]?.formatted_address ?? null : null;
  }

  const data = await getJson(`${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`);
  return data?.display_name ?? null;
}

async function getPlaceSuggestions(text: string): Promise<PlaceSuggestion[]> {
  if (text.trim().length < 2) return [];

  if (useGoogle) {
    const data = await getJson(
      `${GOOGLE_MAPS_URL}/place/autocomplete/json?input=${encodeURIComponent(text)}&language=es&region=ar&key=${GOOGLE_API_KEY}`
    );
    if (!data || (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')) {
      console.warn('[AUTOCOMPLETE] Status inesperado:', data?.status);
      return [];
    }
    return (data.predictions ?? []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  }

  const data = await getJson(
    `${NOMINATIM_URL}/search?q=${encodeURIComponent(text)}&format=json&limit=5&addressdetails=1&countrycodes=ar&accept-language=es`
  );
  return (data ?? []).map((item: any) => ({
    placeId: String(item.place_id),
    description: item.display_name,
    coordinates: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) },
  }));
}

async function obtenerCaminoSeguro(origen: LatLng, destino: LatLng): Promise<RutaSegura> {
  const data = await request<any>('/api/calcular-camino-seguro', {
    method: 'POST',
    body: JSON.stringify({ origen, destino }),
  });

  const feature = data?.features?.[0];
  if (!feature?.geometry) throw new Error('El backend no devolvió una ruta válida');

  const summary = feature.properties?.summary ?? { distance: 0, duration: 0 };
  return {
    geometry: feature.geometry,
    distanceText: formatDistance(summary.distance),
    durationText: formatDuration(summary.duration),
    safetyAssessment: feature.properties?.safety_assessment ?? data.safety_assessment,
  };
}

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
    obtenerCaminoSeguro,

    // enviarFeedback: (feedbackData: { rating: number; comentario: string; resumenViaje: any }) =>
    //   request('/feedback', {
    //     method: 'POST',
    //     body: JSON.stringify(feedbackData),
    //   }),
  },

  // =========================================================================
  // GOOGLE MAPS / ORS (Geocodificación y Ruta Rápida)
  // =========================================================================
  google: {
    getRouteORS: (origin: LatLng, destination: LatLng) =>
      request<RouteResult>('/api/directions', {
        method: 'POST',
        body: JSON.stringify({ origin, destination }),
        requiresAuth: false,
      }),

    geocodeAddress,
    reverseGeocode,
    getPlaceSuggestions,
  },
};
