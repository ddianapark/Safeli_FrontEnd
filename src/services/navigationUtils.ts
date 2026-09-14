import { RouteStep, CoordinatesTuple } from '../types/navigation_types';

// Diccionario de maniobras basado en el campo 'type' de OpenRouteService
const MANEUVER_TYPES: Record<number, string> = {
  0: 'Gire a la izquierda en',
  1: 'Gire a la derecha en',
  2: 'Gire levemente a la izquierda en',
  3: 'Gire levemente a la derecha en',
  4: 'Gire pronunciadamente a la izquierda en',
  5: 'Gire pronunciadamente a la derecha en',
  6: 'Siga derecho en',
  7: 'En la rotonda tome la salida en',
  8: 'Haga un giro en U en',
  9: 'Inicie el recorrido en',
  10: 'Llegó a su destino',
  11: 'Diríjase hacia el este en',
  12: 'Diríjase hacia el oeste en',
  13: 'Diríjase hacia el norte en',
  14: 'Diríjase hacia el sur en',
};

// Traduce y formatea una instrucción del paso actual.
export const translateStep = (step?: RouteStep | null): string => {
  if (!step) return '';

  if (step.type === 10) {
    return `Llegó a su destino en ${step.name || 'el punto indicado'}`;
  }

  const prefix = MANEUVER_TYPES[step.type] || 'Avance por';
  const streetName = step.name && step.name !== '-' ? step.name : '';

  return `${prefix} ${streetName}`.trim();
};

// Formatea distancias de metros a km o m.
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// Cálculo de distancia Haversine en metros entre dos coordenadas [longitud, latitud].
export const getDistanceMeters = (
  coord1: CoordinatesTuple,
  coord2: CoordinatesTuple
): number => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};