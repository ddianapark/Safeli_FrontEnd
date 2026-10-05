export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion {
  description: string;
  placeId?: string;
  place_id?: string;
  coordinates?: LatLng;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

export interface RouteResult {
  polylinePoints: LatLng[];
  distanceText?: string;
  durationText?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  safetyAssessment?: {
    estrellas?: number;
  };
}

export interface RutaSegura {
  id?: string;
  distanceText?: string;
  durationText?: string;
  safetyScore?: number;
  safetyAssessment?: {
    estrellas?: number;
  };
  geometry: {
    type?: string;
    coordinates: [number, number][];
  };
}
