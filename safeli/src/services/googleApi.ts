import { Platform } from 'react-native'; 
const GOOGLE_API_KEY = 'AIzaSyCdskEeFYDGRFyPSdaJizI_Y_8jaDkW_O4';


export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  polylinePoints: LatLng[];
  durationText: string;
  distanceText: string;
  durationSeconds: number;
}

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0; 
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60); // round es más preciso que floor
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

// Geocoding (Google, funciona en ambas plataformas), convierte el texto en un punto del mapa
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  try {
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?address=${encodeURIComponent(address)}` +
        `&language=es` +
        `&region=ar` +
        `&key=${GOOGLE_API_KEY}`;

      console.log('[GEOCODE] Buscando:', address);

      const response = await fetch(url);
      const data = await response.json();

      console.log('[GEOCODE] Status:', data.status);

      if (data.status !== 'OK' || !data.results?.length) {
        console.warn('[GEOCODE] Sin resultados:', address);
        return null;
      }

      const result = data.results[0];

      const location = result.geometry.location;

      console.log('[GEOCODE] Resultado:', {
        direccion: result.formatted_address,
        lat: location.lat,
        lng: location.lng,
      });

      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } catch (error) {
      console.error('[GEOCODE] Error:', error);
      return null;
    }
}

// Ruta en MOBILE: Google Directions API (requiere API key, funciona en ambas plataformas EN AUTO, NO CAMINANDO pero es más común en mobile)
async function getRouteGoogle(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  try {
    console.log('[GOOGLE ROUTE] Origen:', origin);
    console.log('[GOOGLE ROUTE] Destino:', destination);

    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.latitude},${origin.longitude}` +
      `&destination=${destination.latitude},${destination.longitude}` +
      `&mode=walking` +
      `&language=es` +
      `&region=ar` +
      `&units=metric` +
      `&alternatives=false` +
      `&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('[GOOGLE ROUTE] Status:', data.status);

    if (data.status !== 'OK') {
      console.error(
        '[GOOGLE ROUTE] Error:',
        data.status,
        data.error_message
      );
      return null;
    }

    if (!data.routes?.length) {
      console.warn('[GOOGLE ROUTE] No se encontraron rutas');
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    console.log('[GOOGLE ROUTE] Distancia:', leg.distance.text);
    console.log('[GOOGLE ROUTE] Duración:', leg.duration.text);

    return {
      polylinePoints: decodePolyline(
        route.overview_polyline.points
      ),
      distanceText: leg.distance.text,
      durationText: leg.duration.text,
      durationSeconds: leg.duration.value,
    };
  } catch (error) {
    console.error('[GOOGLE ROUTE] Error:', error);
    return null;
  }
}

// Ruta en WEB: OSRM (sin CORS, sin API key)
async function getRouteOSRM(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  const url =
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/` + 
    `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes[0]) return null;

  const route = data.routes[0];
  const coords: LatLng[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
    latitude: lat,
    longitude: lng,
  }));

  return {
    polylinePoints: coords,
    durationText: formatDuration(Math.round(route.duration)),
    distanceText: formatDistance(Math.round(route.distance)),
    durationSeconds: Math.round(route.duration),
  };
}


// se fija si es web (OpenStreetMap) o mobile (GoogleMapsApi)
export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  if (Platform.OS === 'web') {
    return getRouteOSRM(origin, destination);
  }
  return getRouteGoogle(origin, destination);
}

// sugerencias  buscador
export interface PlaceSuggestion {
  placeId: string;
  description: string;
  coordinates?: LatLng; // Disponible directamente desde Nominatim (web)
}

// Sugerencias en MOBILE: Google Places Autocomplete API
async function getSuggestionsGoogle(input: string): Promise<PlaceSuggestion[]> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(input)}` +
      `&language=es` +
      `&region=ar` +
      `&key=${GOOGLE_API_KEY}`;

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