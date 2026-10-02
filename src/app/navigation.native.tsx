import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { formatDistance, getDistanceMeters, translateStep } from '../services/navigationUtils';
import { CoordinatesTuple, ORSGeoJSON } from '../types/navigation_types';

interface RealTimeNavigationScreenProps {
  routeData: ORSGeoJSON;
  onFinishNavigation: () => void;
}

interface UserLocationState {
  latitude: number;
  longitude: number;
  heading: number | null;
}

export default function RealTimeNavigationScreen({ routeData, onFinishNavigation }: RealTimeNavigationScreenProps) {
  const feature = routeData.features[0];
  const coordinates = feature.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
  const rawCoordinates = feature.geometry.coordinates;
  const steps = feature.properties.segments[0].steps;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<UserLocationState | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const currentStepIndexRef = useRef(currentStepIndex);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    let isMounted = true;
    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (location) => {
          if (!isMounted) return;
          const { latitude, longitude, heading } = location.coords;
          const userCoords: CoordinatesTuple = [longitude, latitude];
          setUserLocation({ latitude, longitude, heading });

          mapRef.current?.animateCamera({
            center: { latitude, longitude },
            pitch: 45,
            zoom: 18,
            heading: heading || 0,
          });

          checkStepProgress(userCoords);
        }
      );
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, []); // Dependencias vacías para mantener el watcher activo de forma continua

  const checkStepProgress = (userCoords: CoordinatesTuple) => {
    const idx = currentStepIndexRef.current;
    if (idx >= steps.length) return;

    const currentStep = steps[idx];
    const targetWaypointIndex = currentStep.way_points[1];
    const targetCoordinate = rawCoordinates[targetWaypointIndex];

    if (!targetCoordinate) return;

    const distanceToNextStep = getDistanceMeters(userCoords, targetCoordinate);
    if (distanceToNextStep < 25) {
      if (idx < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else if (onFinishNavigation) {
        onFinishNavigation();
      }
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        followsUserLocation
        showsCompass={false}
      >
        <Polyline coordinates={coordinates} strokeColor="#388e3c" strokeWidth={6} />
        {coordinates.length > 0 && <Marker coordinate={coordinates[coordinates.length - 1]} title="Destino" />}
      </MapView>

      {currentStep && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>{translateStep(currentStep)}</Text>
          <Text style={styles.subInstructionText}>En {formatDistance(currentStep.distance)}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButton} onPress={onFinishNavigation}>
          <Text style={styles.finishButtonText}>Finalizar Viaje</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  instructionBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  instructionText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  subInstructionText: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  finishButton: { backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  finishButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});