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

// ─── Decodificador de Google Encoded Polyline ────────────────────────────────
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0; result = 0;
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

// ─── Geocoding (Google, funciona en ambas plataformas) ───────────────────────
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}&language=es`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.results[0]) return null;
  const { lat, lng } = data.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
}

// ─── Ruta en MOBILE: Google Directions API ───────────────────────────────────
async function getRouteGoogle(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${origin.latitude},${origin.longitude}` +
    `&destination=${destination.latitude},${destination.longitude}` +
    `&mode=walking&language=es&key=${GOOGLE_API_KEY}`;  // ✅ walking

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes[0]) return null;

  const leg = data.routes[0].legs[0];
  return {
    polylinePoints: decodePolyline(data.routes[0].overview_polyline.points),
    durationText: leg.duration.text,   // Google ya devuelve el texto correcto
    distanceText: leg.distance.text,
    durationSeconds: leg.duration.value,
  };
}

// ─── Ruta en WEB: OSRM (sin CORS, sin API key) ───────────────────────────────
async function getRouteOSRM(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +  // ✅ foot = caminata
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

// ─── Exportado: elige automáticamente según plataforma ───────────────────────
export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  if (Platform.OS === 'web') {
    return getRouteOSRM(origin, destination);
  }
  return getRouteGoogle(origin, destination);
}