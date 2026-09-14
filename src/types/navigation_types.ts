import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface RouteStep {
  distance: number;
  duration: number;
  type: number;
  instruction: string;
  name: string;
  way_points: [number, number];
}

export type CoordinatesTuple = [number, number]; // [longitud, latitud]

export interface RouteSegment {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteProperties {
  summary: {
    distance: number;
    duration: number;
  };
  segments: RouteSegment[];
}

export interface RouteGeometry {
  coordinates: CoordinatesTuple[];
  type: string;
}

export interface RouteFeature {
  type: string;
  properties: RouteProperties;
  geometry: RouteGeometry;
}

export interface ORSGeoJSON {
  type: string;
  features: RouteFeature[];
}

export type RootStackParamList = {
  Home: undefined;
  RealTimeNavigation: {
    routeData: ORSGeoJSON;
  };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type RealTimeNavigationProps = NativeStackScreenProps<RootStackParamList, 'RealTimeNavigation'>;