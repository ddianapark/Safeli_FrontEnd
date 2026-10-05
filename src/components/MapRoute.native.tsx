import React, { useRef, useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import type { LatLng, RouteResult, RutaSegura } from '../types/route_types';
import { splitRouteByProgress } from '../services/routeUtils';

interface Props {
  userLocation: LatLng;
  destination: LatLng | null;
  safeliRoute: RutaSegura | null;
  googleRoute: RouteResult | null;
  activeRouteType: 'safeli' | 'google';
  onSelectRoute: (type: 'safeli' | 'google') => void;
  onMapPress?: (location: LatLng) => void; // <-- Nueva prop
}

export default function MapRouteNative({
  userLocation,
  destination,
  safeliRoute,
  googleRoute,
  activeRouteType,
  onSelectRoute,
  onMapPress
}: Props) {
  const mapRef = useRef<MapView>(null);

  // Mapeamos el GeoJSON de Safeli a LatLng plano nativo
  const safeliNativeCoords = safeliRoute?.geometry?.coordinates
    ? safeliRoute.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }))
    : [];

  const googleNativeCoords = googleRoute?.polylinePoints || [];

  useEffect(() => {
    const allCoords = [...safeliNativeCoords, ...googleNativeCoords];
    
    if (allCoords.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(allCoords, {
          edgePadding: { top: 80, right: 50, bottom: 260, left: 50 },
          animated: true,
        });
      }, 300);
    }
  }, [safeliRoute, googleRoute]);

  // Preparamos los arrays de puntos de la ruta activa
  const activePoints: LatLng[] = activeRouteType === 'safeli' ? safeliNativeCoords : googleNativeCoords;
  const { traveled, remaining } = splitRouteByProgress(userLocation, activePoints);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
      onPress={(e) => {
        if (onMapPress) {
          onMapPress(e.nativeEvent.coordinate);
        }
      }}
    >
      
      {destination && (
        <Marker coordinate={destination} title="Destino" pinColor="#E63946" />
      )}

      {/* RUTA NO ACTIVA: Se dibuja atenuada como opción de fondo */}
      {activeRouteType === 'google' && safeliNativeCoords.length > 0 && (
        <Polyline
          coordinates={safeliNativeCoords}
          strokeColor="rgba(29, 45, 164, 0.35)"
          strokeWidth={4}
          tappable
          onPress={() => onSelectRoute('safeli')}
        />
      )}

      {activeRouteType === 'safeli' && googleNativeCoords.length > 0 && (
        <Polyline
          coordinates={googleNativeCoords}
          strokeColor="rgba(255, 122, 0, 0.35)"
          strokeWidth={4}
          tappable
          onPress={() => onSelectRoute('google')}
        />
      )}

      {/* RUTA ACTIVA: Tramo ya recorrido (Transparencia alta / opacidad baja) */}
      {traveled.length > 1 && (
        <Polyline
          coordinates={traveled}
          strokeColor={activeRouteType === 'safeli' ? 'rgba(29, 45, 164, 0.25)' : 'rgba(255, 122, 0, 0.25)'}
          strokeWidth={5}
          zIndex={2}
        />
      )}

      {/* RUTA ACTIVA: Tramo restante por recorrer (Opacidad 100%) */}
      {remaining.length > 1 && (
        <Polyline
          coordinates={remaining}
          strokeColor={activeRouteType === 'safeli' ? '#1D2DA4' : '#FF7A00'}
          strokeWidth={6}
          zIndex={3}
        />
      )}
    </MapView>
  );
}