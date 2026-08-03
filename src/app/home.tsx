import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import MapRoute from '../components/MapRoute';
// 1. Cambiamos getRoute por getGoogleRoute
import { geocodeAddress, getGoogleRoute, getPlaceSuggestions, LatLng, RouteResult, PlaceSuggestion } from '../services/googleApi';
import { RutaSegura, obtenerCaminoSeguro } from '../services/safeliApi';
// 2. Importamos el contexto de autenticación para obtener el token JWT
import { useAuth } from '../context/authContext';

export default function HomeScreen() {
  const { token } = useAuth(); // Token JWT del usuario logueado

  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState<LatLng>({ latitude: -34.6037, longitude: -58.3816 });
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searching, setSearching] = useState(false);

  // Estados duales
  const [safeliRoute, setSafeliRoute] = useState<RutaSegura | null>(null);
  const [googleRoute, setGoogleRoute] = useState<RouteResult | null>(null);
  const [activeRouteType, setActiveRouteType] = useState<'safeli' | 'google'>('safeli');

  // Sugerencias buscador
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

  // ─── Resolver unificado para traer AMBAS rutas en paralelo ──────────────────
  const resolveAndRouteDual = async (geo: LatLng) => {
    setDestination(geo);
    
    // Ejecutamos ambas solicitudes concurrentemente con los datos y tokens correctos
    const [googleRes, safeliRes] = await Promise.allSettled([
      getGoogleRoute(userLocation, geo),
      obtenerCaminoSeguro(userLocation, geo, token || '')
    ]);

    if (googleRes.status === 'fulfilled' && googleRes.value) {
      setGoogleRoute(googleRes.value);
    } else {
      console.warn('Error al obtener la ruta de Google');
      setGoogleRoute(null);
    }

    if (safeliRes.status === 'fulfilled' && safeliRes.value) {
      setSafeliRoute(safeliRes.value);
    } else {
      console.warn('Error al obtener la ruta de Safeli');
      setSafeliRoute(null);
    }

    // Por defecto, ponemos el foco inicial en Safeli si existe
    if (safeliRes.status === 'fulfilled' && safeliRes.value) {
      setActiveRouteType('safeli');
    } else {
      setActiveRouteType('google');
    }
  };

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
        setSafeliRoute(null);
        setGoogleRoute(null);
        return;
      }
      await resolveAndRouteDual(geo);
    } catch (e) {
      console.error(e);
      alert('Error buscando las rutas');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setQuery(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
    setSearching(true);
    try {
      const geo = suggestion.coordinates ?? await geocodeAddress(suggestion.description);
      if (!geo) {
        alert('No se encontró la dirección');
        return;
      }
      await resolveAndRouteDual(geo);
    } catch (e) {
      console.error(e);
      alert('Error buscando las rutas');
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
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="1 0 20 20">
	<path d="M0 0h24v24H0z" fill="none" />
	<path fill="#fff" d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14" />
</svg>
</Text>}
        </TouchableOpacity>
      </View>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={item.placeId}
                style={[styles.suggestionItem, index < suggestions.length - 1 && styles.suggestionItemBorder]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <Text style={styles.suggestionText} numberOfLines={2}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map pasándole todas las propiedades del desarrollo dual */}
      <View style={styles.mapContainer}>
        <MapRoute 
          userLocation={userLocation} 
          destination={destination ?? userLocation} 
          safeliRoute={safeliRoute}
          googleRoute={googleRoute}
          activeRouteType={activeRouteType}
          onSelectRoute={setActiveRouteType}
        />
      </View>

      {/* Panel de rutas inspirado en el prototipo */}
      {(safeliRoute || googleRoute) && (
        <View style={styles.protoCardContainer}>
          
          {/* Fila Camino Safeli */}
          {safeliRoute && (
            <TouchableOpacity 
              style={[styles.protoRow, activeRouteType === 'safeli' && styles.protoRowActive]}
              onPress={() => setActiveRouteType('safeli')}
            >
              <View style={styles.protoLeft}>
                <Text style={styles.protoTitle}>Camino Safeli</Text>
                <Text style={styles.protoStars}>★★★★★</Text>
              </View>
              <View style={styles.protoRight}>
                <Text style={styles.protoTime}>{safeliRoute.durationText || 'N/D'}</Text>
                {activeRouteType === 'safeli' && (
                  <TouchableOpacity style={styles.protoStartButton}>
                    <Text style={styles.protoStartText}>Iniciar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Fila Camino Rápido */}
          {googleRoute && (
            <TouchableOpacity 
              style={[styles.protoRow, activeRouteType === 'google' && styles.protoRowActive]}
              onPress={() => setActiveRouteType('google')}
            >
              <View style={styles.protoLeft}>
                <Text style={styles.protoTitle}>Camino Rápido</Text>
                <Text style={styles.protoStarsMuted}>★★☆☆☆</Text>
              </View>
              <View style={styles.protoRight}>
                <Text style={styles.protoTime}>{googleRoute.durationText || 'N/D'}</Text>
                {activeRouteType === 'google' && (
                  <TouchableOpacity style={styles.protoStartButton2}>
                    <Text style={styles.protoStartText}>Iniciar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    left: 50,
    right: 16,
    zIndex: 200,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D6E4F7',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  searchButton: {
    backgroundColor: '#1A3FA8',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
  },
  searchButtonText: { color: '#fff', fontWeight: '700' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 248, 255, 0.8)',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  loadingText: {
    marginTop: 12,
    color: '#1A3FA8',
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: SUGGESTIONS_TOP,
    left: 16,
    right: 16,
    zIndex: 199,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  suggestionItemBorder: { borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  suggestionIcon: { fontSize: 15 },
  suggestionText: { flex: 1, fontSize: 13, color: '#1A202C', lineHeight: 18 },
  mapContainer: { flex: 1 },
  
  protoCardContainer: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D2DA4',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  protoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
  },
  protoRowActive: {
    backgroundColor: '#F0F3FF',
  },
  protoLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  protoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2DA4',
  },
  protoStars: {
    color: '#1D2DA4',
    fontSize: 14,
  },
  protoStarsMuted: {
    color: 'rgb(255, 122, 0)',
    fontSize: 14,
  },
  protoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  protoTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  protoStartButton: {
    backgroundColor: '#1D2DA4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  protoStartButton2: {
    backgroundColor: 'rgb(255, 122, 0)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  protoStartText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});