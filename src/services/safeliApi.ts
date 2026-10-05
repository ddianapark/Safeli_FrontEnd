const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://safeli-api.vercel.app';
export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface SafetyAssessment {
  estrellas: number;
  porcentajeExpuesto: number;
  metrosExpuestos: number;
  distanciaTotalMetros: number;
}

export interface RutaSegura {
  geometry: any; // GeoJSON Geometry (LineString normalmente)
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  safetyAssessment?: SafetyAssessment; // 🌟 Agregado
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 min";
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

export const obtenerCaminoSeguro = async (origen: Coordenadas, destino: Coordenadas, token: string): Promise<RutaSegura> => {
  const response = await fetch(BACKEND_URL + '/api/calcular-camino-seguro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ origen, destino }),
  });

  if (!response.ok) throw new Error('Error al obtener la ruta segura');

  const data = await response.json();
  const feature = data.features?.[0];

  if (!feature || !feature.geometry) {
    throw new Error('El backend no devolvió una ruta válida');
  }

  const summary = feature.properties?.summary ?? { distance: 0, duration: 0 };
  
  // Extraemos la evaluación de seguridad devuelta por el backend
  const safetyAssessment = feature.properties?.safety_assessment || data.safety_assessment;

  return {
    geometry: feature.geometry,
    distanceText: formatDistance(summary.distance),
    durationText: formatDuration(summary.duration),
    durationSeconds: summary.duration,
    safetyAssessment: safetyAssessment, // 🌟 Se asigna aquí
  };
};