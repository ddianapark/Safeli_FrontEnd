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
// Distancia mínima (en metros) desde un punto hasta una polilínea.
// Se mide contra los TRAMOS y no solo contra los vértices, para no dar falsos desvíos
// cuando el usuario está sobre la ruta pero lejos de un vértice (tramos rectos largos).
export function getDistanceToRouteMeters(point: LatLng, routePoints: LatLng[]): number {
  if (!routePoints || routePoints.length === 0) return Infinity;
  if (routePoints.length === 1) return getDistanceMeters(point, routePoints[0]);

  const R = 6371e3;
  const rad = Math.PI / 180;
  const cosLat = Math.cos(point.latitude * rad);

  // Proyección plana local (metros) centrada en el punto: precisa para distancias de cientos de metros
  const toXY = (p: LatLng) => ({
    x: (p.longitude - point.longitude) * rad * R * cosLat,
    y: (p.latitude - point.latitude) * rad * R,
  });

  let min = Infinity;
  let a = toXY(routePoints[0]);
  for (let i = 1; i < routePoints.length; i++) {
    const b = toXY(routePoints[i]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    // El punto del usuario es el origen (0,0): proyectamos sobre el segmento a-b
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / len2));
    min = Math.min(min, Math.hypot(a.x + t * dx, a.y + t * dy));
    a = b;
  }
  return min;
}