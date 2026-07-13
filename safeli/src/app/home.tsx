import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Keyboard } from 'react-native';
import * as Location from 'expo-location';

import MapRoute from '../components/MapRoute';
import { geocodeAddress, getRoute, getPlaceSuggestions, LatLng, RouteResult, PlaceSuggestion } from '../services/googleApi';
import { useAuth } from '../context/authContext';

import { obtenerCaminoSeguro } from '../services/safeliApi';

export default function HomeScreen() {
  const { logout } = useAuth();

  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState<LatLng>({ latitude: -34.6037, longitude: -58.3816 });
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searching, setSearching] = useState(false);

  // sugerencias buscador
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ─── Debounced suggestions fetch ───────────────────────────────────────────
  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await getPlaceSuggestions(text.trim());
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 350);
  };

  // ─── Shared route resolver ─────────────────────────────────────────────────
  const resolveAndRouteGoogle = async (geo: LatLng) => {
    setDestination(geo);
    const r = await getRoute(userLocation, geo);
    setRoute(r);
  };

  // ─── Shared route resolver ─────────────────────────────────────────────────
  const resolveAndRoute = async (geo: LatLng) => {
    setDestination(geo);
    try {
      // 1. Mapeamos el formato de Expo Location al que espera tu API (Safeli)
      const origen = { lat: userLocation.latitude, lng: userLocation.longitude };
      const destino = { lat: geo.latitude, lng: geo.longitude };

      // 2. Llamamos a tu backend en lugar de a Google
      const rutaSegura = await obtenerCaminoSeguro(origen, destino);
      
      // 3. Guardamos el resultado en el estado
      setRoute(rutaSegura);
    } catch (error) {
      console.error("Error al calcular la ruta segura:", error);
      alert('No se pudo trazar un camino seguro hacia el destino.');
      setRoute(null);
    }
  };

  // ─── Buscar directo (botón o teclado) ─────────────────────────────────────
  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setSuggestions([]);
    setShowSuggestions(false);
    setSearching(true);
    try {
      const geo = await geocodeAddress(query.trim());
      if (!geo) {
        alert('No se encontró la dirección');
        setDestination(null);
        setRoute(null);
        return;
      }
      await resolveAndRoute(geo);
    } catch (e) {
      console.error(e);
      alert('Error buscando la ruta');
    } finally {
      setSearching(false);
    }
  };

  // ─── Seleccionar sugerencia ────────────────────────────────────────────────
  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setQuery(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
    setSearching(true);
    try {
      // Nominatim ya trae coordenadas; Google las resuelve vía geocode
      const geo = suggestion.coordinates ?? await geocodeAddress(suggestion.description);
      if (!geo) {
        alert('No se encontró la dirección');
        return;
      }
      await resolveAndRoute(geo);
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
          onChangeText={handleQueryChange}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          {searching
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.searchButtonText}>Buscar</Text>}
        </TouchableOpacity>
      </View>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={item.placeId}
                style={[
                  styles.suggestionItem,
                  index < suggestions.length - 1 && styles.suggestionItemBorder,
                ]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapRoute userLocation={userLocation} destination={destination} route={route} />
      </View>

      {/* Route info */}
      {route && route.durationText ? (
        <View style={styles.routeCard}>
          <Text style={styles.routeText}>
            Duración: {route.durationText} • Distancia: {route.distanceText}
          </Text>
        </View>
      ) : null}

      {/* footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => { setDestination(null); setRoute(null); setQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
          <Text style={styles.logoutText}>home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SEARCH_TOP = Platform.OS === 'web' ? 16 : 48;
const SEARCH_BAR_HEIGHT = 44;
const SUGGESTIONS_TOP = SEARCH_TOP + SEARCH_BAR_HEIGHT + 6;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    position: 'absolute',
    top: SEARCH_TOP,
    left: 60,
    right: 16,
    zIndex: 200,
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
  suggestionsContainer: {
    position: 'absolute',
    top: SUGGESTIONS_TOP,
    left: 60,
    right: 16,
    zIndex: 199,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  suggestionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
  },
  suggestionIcon: {
    fontSize: 15,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#1A202C',
    lineHeight: 18,
  },
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