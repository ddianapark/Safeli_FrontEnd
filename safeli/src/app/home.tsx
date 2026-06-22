import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as Location from 'expo-location';

import MapRoute from '../components/MapRoute';
import { geocodeAddress, getRoute, LatLng, RouteResult } from '../services/googleApi';
import { useAuth } from '../context/authContext';

export default function HomeScreen() {
  const { logout } = useAuth();

  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState<LatLng>({ latitude: -34.6037, longitude: -58.3816 });
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoadingLocation(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (e) {
        console.warn('Location error', e);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const geo = await geocodeAddress(query.trim());
      if (!geo) {
        alert('No se encontró la dirección');
        setDestination(null);
        setRoute(null);
        return;
      }
      setDestination(geo);
      const r = await getRoute(userLocation, geo);
      setRoute(r);
    } catch (e) {
      console.error(e);
      alert('Error buscando la ruta');
    } finally {
      setSearching(false);
    }
  };

  if (loadingLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A3FA8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Buscar dirección o lugar"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Buscar</Text>}
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapRoute userLocation={userLocation} destination={destination} route={route} />
      </View>

      {/* Route info */}
      {route ? (
        <View style={styles.routeCard}>
          <Text style={styles.routeText}>Duración: {route.durationText} • Distancia: {route.distanceText}</Text>
        </View>
      ) : null}

      {/* footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => { setDestination(null); setRoute(null); setQuery(''); }}>
          <Text style={styles.logoutText}>home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 60,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#D6E4F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchButton: {
    backgroundColor: '#1A3FA8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: { color: '#fff', fontWeight: '700' },
  mapContainer: { flex: 1 },
  routeCard: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  routeText: { color: '#1A202C', fontWeight: '600' },
  footer: {
    height: 56,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  welcome: { color: '#1A202C' },
  logoutButton: { marginLeft: 12 },
  logoutText: { color: '#1A3FA8', fontWeight: '700' },
});