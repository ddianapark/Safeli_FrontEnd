import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { geocodeAddress, getRoute, LatLng, RouteResult } from '../services/googleApi';

// Expo resuelve automáticamente MapRoute.native.tsx en mobile y MapRoute.web.tsx en web
import MapRoute from '../components/MapRoute';

export default function HomeScreen() {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [searchText, setSearchText] = useState('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('Error', 'Tu browser no soporta geolocalización.');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            setLocationReady(true);
          },
          () => Alert.alert('Permiso denegado', 'Necesitamos tu ubicación para calcular la ruta.')
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para calcular la ruta.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setLocationReady(true);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchText.trim() || !userLocation) return;
    Keyboard.dismiss();
    setLoading(true);
    setRoute(null);
    setDestination(null);

    try {
      const destCoords = await geocodeAddress(searchText);
      if (!destCoords) {
        Alert.alert('No encontrado', 'No pudimos encontrar esa ubicación.');
        return;
      }
      setDestination(destCoords);

      const routeResult = await getRoute(userLocation, destCoords);
      if (!routeResult) {
        Alert.alert('Sin ruta', 'No pudimos calcular una ruta hacia ese destino.');
        return;
      }
      setRoute(routeResult);
    } catch {
      Alert.alert('Error', 'Ocurrió un error. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {locationReady && userLocation ? (
        <View style={StyleSheet.absoluteFillObject}>
          <MapRoute userLocation={userLocation} destination={destination} route={route} />
        </View>
      ) : (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color="#1D3557" />
          <Text style={styles.mapLoadingText}>Obteniendo tu ubicación...</Text>
        </View>
      )}

      {/* Barra de búsqueda */}
      <View style={styles.searchPanel}>
        <TextInput
          style={styles.searchInput}
          placeholder="¿A dónde vas?"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Ir</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info de ruta */}
      {route && (
        <View style={styles.infoPanel}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>⏱ Duración</Text>
              <Text style={styles.infoValue}>{route.durationText}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📍 Distancia</Text>
              <Text style={styles.infoValue}>{route.distanceText}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE' },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mapLoadingText: { color: '#1D3557', fontSize: 15, fontWeight: '500' },
  searchPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  searchInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1D3557' },
  searchButton: { backgroundColor: '#1D3557', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  searchButtonDisabled: { opacity: 0.6 },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  infoPanel: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  infoItem: { alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 13, color: '#888', fontWeight: '500' },
  infoValue: { fontSize: 20, fontWeight: '700', color: '#1D3557' },
  infoDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
});