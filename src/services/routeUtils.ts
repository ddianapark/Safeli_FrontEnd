import type { LatLng } from '../types/route_types';

// Función para calcular distancia en metros entre dos puntos (Fórmula de Haversine)
export function getDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const rad = Math.PI / 180;
  const dLat = (p2.latitude - p1.latitude) * rad;
  const dLon = (p2.longitude - p1.longitude) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.latitude * rad) * Math.cos(p2.latitude * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Encuentra el índice del punto más cercano a la posición del usuario
export function findClosestPointIndex(userLoc: LatLng, routePoints: LatLng[]): number {
  let closestIndex = 0;
  let minDistance = Infinity;

  routePoints.forEach((pt, index) => {
    const dist = getDistanceMeters(userLoc, pt);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = index;
    }
  });

  return closestIndex;
}

// Divide las coordenadas en [recorridas, restantes]
export function splitRouteByProgress(userLoc: LatLng, routePoints: LatLng[]) {
  if (!routePoints || routePoints.length === 0) {
    return { traveled: [], remaining: [] };
  }

  const closestIndex = findClosestPointIndex(userLoc, routePoints);

  // Trazo recorrido: desde el inicio hasta la ubicación actual del usuario
  const traveled = routePoints.slice(0, closestIndex + 1);
  traveled.push(userLoc); // Conectamos suavemente con el punto GPS actual

  // Trazo restante: desde la ubicación actual hasta el final
  const remaining = [userLoc, ...routePoints.slice(closestIndex + 1)];

  return { traveled, remaining };
}