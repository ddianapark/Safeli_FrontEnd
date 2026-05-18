import React, { useRef, useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { LatLng, RouteResult } from '../services/googleApi';

interface Props {
  userLocation: LatLng;
  destination: LatLng | null;
  route: RouteResult | null;
}

export default function MapRoute({ userLocation, destination, route }: Props) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (route && route.polylinePoints.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(route.polylinePoints, {
          edgePadding: { top: 80, right: 50, bottom: 220, left: 50 },
          animated: true,
        });
      }, 300);
    }
  }, [route]);

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
      {route && (
        <Polyline
          coordinates={route.polylinePoints}
          strokeColor="#1D3557"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}