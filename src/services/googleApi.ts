import { Platform } from "react-native";

declare const EXPO_PUBLIC_GOOGLE_API_KEY: string | undefined;

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  polylinePoints: LatLng[];
  distanceText?: string;
  durationText?: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  coordinates?: LatLng;
}

const BACKEND_URL = 'http://localhost:3000'; // Ajustá a la URL de tu servidor Node.js

// 1. Obtener la ruta de Google desde tu backend
export async function getGoogleRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    const response = await fetch(
      `${BACKEND_URL}/api/directions?origin=${originStr}&destination=${destStr}`
    );

    if (!response.ok) return null;
    const data = await response.json();

    return {
      polylinePoints: data.polylinePoints || [],
      distanceText: data.distanceText,
      durationText: data.durationText,
    };
  } catch (error) {
    console.error('Error obteniendo ruta de Google:', error);
    return null;
  }
}

// 2. Geocodificación (Dirección a Coordenadas)
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

// 3. Autocompletado de direcciones
// Sugerencias en MOBILE: Google Places Autocomplete API
async function getSuggestionsGoogle(input: string): Promise<PlaceSuggestion[]> {
  try {
    const googleApiKey = EXPO_PUBLIC_GOOGLE_API_KEY ?? "";
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