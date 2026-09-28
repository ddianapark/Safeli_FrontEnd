import { Platform } from "react-native";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface SafetyAssessment {
  estrellas: number;
  porcentajeExpuesto: number;
  metrosExpuestos: number;
  distanciaTotalMetros: number;
}

export interface RouteResult {
  polylinePoints: LatLng[];
  distanceText?: string;
  durationText?: string;
  safetyAssessment?: SafetyAssessment; // 🌟 Nueva propiedad
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  coordinates?: LatLng;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://safeli-api.vercel.app';

export async function getRouteORS(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  try {
    const payload = {
      origin: {
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      destination: {
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
    };

    const res = await fetch(BACKEND_URL + '/api/directions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data: RouteResult = await res.json();
    if (!data.polylinePoints || data.polylinePoints.length === 0) return null;
    return data;
  } catch (error) {
    console.error('Error en getRouteORS:', error);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/geocode?address=${encodeURIComponent(address)}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error en geocodeAddress:', error);
    return null;
  }
}

// Sugerencias en MOBILE: Google Places Autocomplete API
async function getSuggestionsGoogle(input: string): Promise<PlaceSuggestion[]> {
  try {
    const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "";
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(input)}` +
      `&language=es` +
      `&region=ar` +
      `&key=${googleApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn('[AUTOCOMPLETE] Status inesperado:', data.status);
      return [];
    }

    return (data.predictions ?? []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch (error) {
    console.error('[AUTOCOMPLETE] Error Google:', error);
    return [];
  }
}

// Sugerencias en WEB: Nominatim (sin CORS, sin API key)
async function getSuggestionsNominatim(input: string): Promise<PlaceSuggestion[]> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(input)}` +
      `&format=json` +
      `&limit=5` +
      `&addressdetails=1` +
      `&accept-language=es`;

    const response = await fetch(url, {
      headers: { 'Accept-Language': 'es' },
    });
    const data = await response.json();

    return (data ?? []).map((item: any) => ({
      placeId: String(item.place_id),
      description: item.display_name,
      coordinates: {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      },
    }));
  } catch (error) {
    console.error('[AUTOCOMPLETE] Error Nominatim:', error);
    return [];
  }
}

// Se fija si es web (Nominatim) o mobile (Google Places)
export async function getPlaceSuggestions(input: string): Promise<PlaceSuggestion[]> {
  if (!input.trim() || input.trim().length < 2) return [];
  if (Platform.OS === 'web') {
    return getSuggestionsNominatim(input);
  }
  return getSuggestionsGoogle(input);
}

// Reverse geocoding: devuelve una dirección legible a partir de coordenadas
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "";
    // Si tenemos API key, preferimos usar la API de Google en móvil
    if (googleApiKey) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}&language=es`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    }

    // Fallback a Nominatim (funciona sin API key)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`;
    const nomRes = await fetch(nominatimUrl, { headers: { 'Accept-Language': 'es' } });
    if (!nomRes.ok) return null;
    const nomData = await nomRes.json();
    return nomData.display_name ?? null;
  } catch (error) {
    console.error('Error en reverseGeocode:', error);
    return null;
  }
}