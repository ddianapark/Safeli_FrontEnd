import React, { useRef, useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { LatLng, RouteResult } from '../services/googleApi';
import { RutaSegura } from '../services/safeliApi';

interface Props {
  userLocation: LatLng;
  destination: LatLng | null;
  safeliRoute: RutaSegura | null;
  googleRoute: RouteResult | null;
  activeRouteType: 'safeli' | 'google';
  onSelectRoute: (type: 'safeli' | 'google') => void;
}

export default function MapRouteNative({
  userLocation,
  destination,
  safeliRoute,
  googleRoute,
  activeRouteType,
  onSelectRoute
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

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
    >
      {destination && (
        <Marker coordinate={destination} title="Destino" pinColor="#E63946" />
      )}

      {googleNativeCoords.length > 0 && (
        <Polyline 
          coordinates={googleNativeCoords} 
          strokeColor={activeRouteType === 'google' ? '#FF7A00' : 'rgba(255, 122, 0, 0.35)'} 
          strokeWidth={activeRouteType === 'google' ? 6 : 4}
          zIndex={activeRouteType === 'google' ? 2 : 1}
          tappable={true}
          onPress={() => onSelectRoute('google')}
        />
      )}
      
      {safeliNativeCoords.length > 0 && (
        <Polyline 
          coordinates={safeliNativeCoords}
          strokeColor={activeRouteType === 'safeli' ? '#1D2DA4' : 'rgba(29, 45, 164, 0.35)'} 
          strokeWidth={activeRouteType === 'safeli' ? 6 : 4}
          zIndex={activeRouteType === 'safeli' ? 2 : 1}
          tappable={true}
          onPress={() => onSelectRoute('safeli')}
        />
      )}
    </MapView>
  );
}