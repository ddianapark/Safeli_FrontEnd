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

export default function RealTimeNavigationScreen({
  routeData,
  onFinishNavigation,
}: RealTimeNavigationScreenProps) {
  // Extraer datos clave del GeoJSON entregado por tu API
  const feature = routeData.features[0];
  const coordinates = feature.geometry.coordinates.map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));
  const rawCoordinates = feature.geometry.coordinates; // [[lon, lat], ...]
  const steps = feature.properties.segments[0].steps;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<UserLocationState | null>(null);
  const [remainingDistance, setRemainingDistance] = useState(feature.properties.summary.distance);

  const mapRef = useRef<MapView | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Iniciar rastreo de ubicación GPS en tiempo real
  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (location) => {
          if (!isMounted) return;

          const { latitude, longitude, heading } = location.coords;
          const userCoords: CoordinatesTuple = [longitude, latitude] as CoordinatesTuple;
          setUserLocation({ latitude, longitude, heading });

          // Centrar la cámara en la posición actual del usuario
          mapRef.current?.animateCamera({
            center: { latitude, longitude },
            pitch: 45, // Inclinación perspectiva estilo GPS
            zoom: 18,
            heading: heading || 0,
          });

          // Evaluar si se alcanzó el siguiente paso de navegación
          checkStepProgress(userCoords);
        }
      );
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [currentStepIndex]);

  // Lógica para detectar el avance de los waypoints de la ruta
  const checkStepProgress = (userCoords: CoordinatesTuple) => {
    if (currentStepIndex >= steps.length) return;

    const currentStep = steps[currentStepIndex];
    const targetWaypointIndex = currentStep.way_points[1];
    const targetCoordinate = rawCoordinates[targetWaypointIndex];

    if (!targetCoordinate) return;

    // Distancia entre el usuario y el punto final del paso actual
    const distanceToNextStep = getDistanceMeters(userCoords, targetCoordinate);

    // Si el usuario está a menos de 25 metros del waypoint objetivo, pasar al siguiente paso
    if (distanceToNextStep < 25) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prevIndex) => prevIndex + 1);
      } else {
        // Fin del recorrido
        if (onFinishNavigation) onFinishNavigation();
      }
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <View style={styles.container}>
      {/* Mapa Principal */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={true}
        showsCompass={false}
      >
        {/* Renderizado de la ruta estática elegida */}
        <Polyline
          coordinates={coordinates}
          strokeColor="#388e3c" // Verde para ruta segura
          strokeWidth={6}
        />

        {/* Marcador del destino final */}
        {coordinates.length > 0 && (
          <Marker
            coordinate={coordinates[coordinates.length - 1]}
            title="Destino"
          />
        )}
      </MapView>

      {/* Banner Superior: Indicaciones turno a turno */}
      {currentStep && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            {translateStep(currentStep)}
          </Text>
          <Text style={styles.subInstructionText}>
            En {formatDistance(currentStep.distance)}
          </Text>
        </View>
      )}

      {/* Control Inferior: Botón de Finalizar / Cancelar Viaje */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={onFinishNavigation}
        >
          <Text style={styles.finishButtonText}>Finalizar Viaje</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
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
  instructionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subInstructionText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  finishButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});