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
  try {
    const response = await fetch(`${BASE_URL}/calcular-camino-seguro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Enviamos el origen y destino en el formato que tu backend acepta
      body: JSON.stringify({
        origen: origen,
        destino: destino,
      }),
    });

    // Validamos que la respuesta sea exitosa
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener la ruta segura desde la API de Safeli');
    }

    // Retornamos el GeoJSON limpio que tu backend ya procesa
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('❌ Error consumiendo la API de Safeli:', error);
    throw error;
  }
};