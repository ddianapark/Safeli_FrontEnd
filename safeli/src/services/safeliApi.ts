// Definimos la URL base de tu API en producción
const BASE_URL = 'https://safeli-api.vercel.app/api';

// Interfaz para las coordenadas, ideal para la integración con los mapas en el frontend
export interface Coordenadas {
  lat: number;
  lng: number;
}

/**
 * Calcula el camino seguro desde un punto de origen a un destino
 * llamando al backend propio de Safeli.
 */
export const obtenerCaminoSeguro = async (origen: Coordenadas, destino: Coordenadas) => {
  const response = await fetch(`${BASE_URL}/calcular-camino-seguro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origen, destino }),
  });

  if (!response.ok) throw new Error('Error al obtener la ruta segura');

  const data = await response.json();
  // Retornamos todo el objeto para que el estado 'route' en home.tsx tenga los textos
  return data; 
};