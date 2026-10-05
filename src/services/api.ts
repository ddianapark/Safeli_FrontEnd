import { request } from './apiClient';
import {
  geocodeAddress,
  getPlaceSuggestions,
  getRouteORS,
  LatLng,
  reverseGeocode,
} from './googleApi';
import { obtenerCaminoSeguro } from './safeliApi';
import { tokenStorage } from './tokenStorage';

export const api = {
  // =========================================================================
  // SAFELI API (Rutas Seguras y Feedback)
  // =========================================================================
  safeli: {
    obtenerCaminoSeguro: async (origin: LatLng, destination: LatLng) => {
      const token = (await tokenStorage.getAccessToken()) ?? '';
      return obtenerCaminoSeguro(origin, destination, token);
    },

    // TODO: el backend todavía no expone un endpoint de feedback (responde 404)
    enviarFeedback: (feedbackData: { rating: number; comentario: string; resumenViaje: any }) =>
      request('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      }),
  },

  // =========================================================================
  // GOOGLE MAPS / ORS (Geocodificación y Ruta Rápida)
  // =========================================================================
  google: {
    getRouteORS,
    geocodeAddress,
    reverseGeocode,
    getPlaceSuggestions,
  },
};
