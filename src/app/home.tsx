import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import MapRoute from '../components/MapRoute';
import { api } from '../services/api';
import type { LatLng, PlaceSuggestion, RouteResult, RutaSegura } from '../types/route_types';

const LockRating = ({ score, maxScore = 5, color }: { score: number; maxScore?: number; color: string }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
      {Array.from({ length: maxScore }).map((_, index) => (
        <MaterialCommunityIcons
          key={index}
          name={index < score ? 'lock' : 'lock-open-outline'}
          size={16}
          color={color}
        />
      ))}
    </View>
  );
};

const calcularDistanciaMetros = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const toRad = (valor: number) => (valor * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState<LatLng>({ latitude: -34.6037, longitude: -58.3816 });
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searching, setSearching] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [safeliRoute, setSafeliRoute] = useState<RutaSegura | null>(null);
  const [googleRoute, setGoogleRoute] = useState<RouteResult | null>(null);
  const [activeRouteType, setActiveRouteType] = useState<'safeli' | 'google'>('safeli');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rutaActivaRef = useRef<RutaSegura | null>(null);
  const activeRouteTypeRef = useRef(activeRouteType);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [resumenViaje, setResumenViaje] = useState({ origen: '', destino: '', duracion: '' });
  const [enViaje, setEnViaje] = useState(false);

  const isLocationInAMBA = (lat: number, lng: number) => {
    const MIN_LAT = -35.00;
    const MAX_LAT = -34.15;
    const MIN_LNG = -59.15;
    const MAX_LNG = -57.80;
    return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
  };

  useEffect(() => {
    rutaActivaRef.current = safeliRoute;
  }, [safeliRoute]);

  useEffect(() => {
    activeRouteTypeRef.current = activeRouteType;
  }, [activeRouteType]);

  const alertarDesvio = (ubicacionActual: LatLng) => {
    Vibration.vibrate([0, 500, 200, 500], false);
    Alert.alert(
      "¡Desvío de ruta!",
      "Te has alejado del camino sugerido. ¿Deseas recalcular la ruta segura desde tu ubicación actual?",
      [
        { text: "Ignorar", style: "cancel", onPress: () => Vibration.cancel() },
        { 
          text: "Recalcular", 
          onPress: () => { 
            Vibration.cancel(); 
            if (destination) resolveAndRouteDual(destination, ubicacionActual); 
          } 
        }
      ]
    );
  };

  const verificarDesvio = (ubicacionActual: LatLng, rutaActiva: RutaSegura) => {
    const TOLERANCIA_METROS = 50;
    if (!rutaActiva.geometry || !rutaActiva.geometry.coordinates || rutaActiva.geometry.coordinates.length === 0) return;
    
    const coordenadasGeoJSON = rutaActiva.geometry.coordinates;
    const distanciaMinima = Math.min(
      ...coordenadasGeoJSON.map((coord: [number, number]) => 
        calcularDistanciaMetros(ubicacionActual.latitude, ubicacionActual.longitude, coord[1], coord[0])
      )
    );
    
    if (distanciaMinima > TOLERANCIA_METROS) alertarDesvio(ubicacionActual);
  };

  const finalizarViaje = async () => {
    setEnViaje(false);
    let origenTexto = 'Tu ubicación de origen';
    try {
      if (userLocation) {
        const addr = await api.google.reverseGeocode(userLocation.latitude, userLocation.longitude);
        if (addr) origenTexto = addr;
      } else {
        origenTexto = 'Ubicación desconocida';
      }
    } catch (e) {
      console.warn('Reverse geocode failed', e);
      origenTexto = 'Tu ubicación de origen';
    }
    setResumenViaje({ origen: origenTexto, destino: query || 'Destino', duracion: safeliRoute?.durationText || 'N/D' });
    setShowFeedbackModal(true);
  };

  const cerrarFeedback = () => { setShowFeedbackModal(false); setRating(0); setComentario(''); };

  const enviarFeedback = async () => {
    // TODO: el backend todavía no expone un endpoint de feedback
    // try {
    //   await api.safeli.enviarFeedback({ rating, comentario, resumenViaje });
    // } catch (e) {
    //   console.warn('Error al enviar feedback', e);
    // }
    cerrarFeedback();
    setQuery('');
    setDestination(null);
    setSafeliRoute(null);
    setGoogleRoute(null);
    setEnViaje(false); 
    setAlertMessage('¡Llegaste a tu destino con éxito! Gracias por dejar tu feedback.');
  };

  const handleMapPress = async (coords: LatLng) => {
    setUserLocation(coords);
    if (destination) {
      await resolveAndRouteDual(destination, coords);
    }
  };

  // Tracking GPS continuo sin reinicios al cambiar de pestaña
  useEffect(() => {
    let locationSub: Location.LocationSubscription | null = null;
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLoadingLocation(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLoadingLocation(false);
        }

        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 3 },
          (loc) => {
            if (!isMounted) return;
            const nuevaPos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserLocation(nuevaPos);
            if (rutaActivaRef.current && activeRouteTypeRef.current === 'safeli') {
              verificarDesvio(nuevaPos, rutaActivaRef.current);
            }
          }
        );
      } catch (e) {
        console.warn('Location error', e);
        if (isMounted) setLoadingLocation(false);
      }
    })();

    return () => {
      isMounted = false;
      if (locationSub) locationSub.remove();
    };
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await api.google.getPlaceSuggestions(text.trim());
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (e) {
        console.warn('Error al obtener sugerencias', e);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 350);
  };

  const resolveAndRouteDual = async (geo: LatLng, origenOverride?: LatLng) => {
    const origen = origenOverride || userLocation;
    setDestination(geo);

    const [googleRes, safeliRes] = await Promise.allSettled([
      api.google.getRouteORS(origen, geo),
      api.safeli.obtenerCaminoSeguro(origen, geo)
    ]);

    if (googleRes.status === 'fulfilled' && googleRes.value) {
      setGoogleRoute(googleRes.value);
    } else {
      console.warn('Error al obtener la ruta rápida/Google');
      setGoogleRoute(null);
    }

    if (safeliRes.status === 'fulfilled' && safeliRes.value) {
      setSafeliRoute(safeliRes.value);
      setActiveRouteType('safeli');
    } else {
      console.warn('Error al obtener la ruta de Safeli');
      setSafeliRoute(null);
      setActiveRouteType('google');
    }
  };

  // Enter: si hay sugerencias visibles, toma la primera como destino
  const handleSubmit = () => {
    if (showSuggestions && suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }
    handleSearch();
  };

  const handleSearch = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return; Keyboard.dismiss(); setSuggestions([]); setShowSuggestions(false); setSearching(true);
    try { 
      const geo = await api.google.geocodeAddress(query.trim());
      if (!geo) { 
        setAlertMessage('No se encontró la dirección buscada.');
        setDestination(null); setSafeliRoute(null); setGoogleRoute(null); return; 
      } 
      if (!isLocationInAMBA(geo.latitude, geo.longitude)) {
        setAlertMessage('Actualmente la navegación segura solo está disponible dentro del AMBA.');
        return; 
      }
      await resolveAndRouteDual(geo); 
    } catch (e) { 
      console.error(e); setAlertMessage('Ocurrió un error buscando las rutas.'); 
    } finally { 
      setSearching(false); 
    }
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(suggestion.description); setSuggestions([]); setShowSuggestions(false); Keyboard.dismiss(); setSearching(true);
    try { 
      // Corrección de llamada a API centralizada
      const geo = suggestion.coordinates ?? await api.google.geocodeAddress(suggestion.description); 
      if (!geo) { 
        setAlertMessage('No se encontró la dirección buscada.'); return; 
      } 
      if (!isLocationInAMBA(geo.latitude, geo.longitude)) {
        setAlertMessage('Actualmente la navegación segura solo está disponible dentro del AMBA.');
        return; 
      }
      await resolveAndRouteDual(geo); 
    } catch (e) { 
      console.error(e); setAlertMessage('Ocurrió un error buscando las rutas.'); 
    } finally { 
      setSearching(false); 
    }
  };

  if (loadingLocation) return (<View style={styles.center}><ActivityIndicator size="large" color="#1A3FA8" /></View>);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput placeholder="Buscar dirección o lugar" value={query} onChangeText={handleQueryChange} style={styles.searchInput} returnKeyType="search" onSubmitEditing={handleSubmit} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>{searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Buscar</Text>}</TouchableOpacity>
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {suggestions.map((item, index) => (
              <TouchableOpacity key={item.placeId} style={[styles.suggestionItem, index < suggestions.length - 1 && styles.suggestionItemBorder]} onPress={() => handleSelectSuggestion(item)} activeOpacity={0.7}>
                <Text style={styles.suggestionIcon}>📍</Text>
                <Text style={styles.suggestionText} numberOfLines={2}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapRoute 
          userLocation={userLocation} 
          destination={destination ?? userLocation} 
          safeliRoute={safeliRoute} 
          googleRoute={googleRoute} 
          activeRouteType={activeRouteType} 
          onSelectRoute={setActiveRouteType} 
          onMapPress={handleMapPress}
        />
      </View>

      {(safeliRoute || googleRoute) && (
        <View style={styles.protoCardContainer}>
          {enViaje ? (
            <View style={styles.activeTripContainer}>
              <View style={styles.activeTripHeader}>
                <MaterialCommunityIcons name="navigation" size={24} color="#1D2DA4" />
                <Text style={styles.activeTripTitle}>Navegando hacia tu destino</Text>
              </View>
              <TouchableOpacity style={styles.endTripButton} onPress={finalizarViaje}><Text style={styles.endTripText}>Terminar viaje</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              {safeliRoute && (
                <TouchableOpacity style={[styles.protoRow, activeRouteType === 'safeli' && styles.protoRowActive]} onPress={() => setActiveRouteType('safeli')}>
                  <View style={styles.protoLeft}><Text style={styles.protoTitle}>Camino Safeli</Text><LockRating score={safeliRoute.safetyAssessment?.estrellas ?? 5} color="#1D2DA4" /></View>
                  <View style={styles.protoRight}><Text style={styles.protoTime}>{safeliRoute.durationText || 'N/D'}</Text>{activeRouteType === 'safeli' && (<TouchableOpacity style={styles.protoStartButton} onPress={() => setEnViaje(true)}><Text style={styles.protoStartText}>Iniciar</Text></TouchableOpacity>)}</View>
                </TouchableOpacity>
              )}

              {googleRoute && (
                <TouchableOpacity style={[styles.protoRow, activeRouteType === 'google' && styles.protoRowActive]} onPress={() => setActiveRouteType('google')}>
                  <View style={styles.protoLeft}><Text style={styles.protoTitle}>Camino Rápido</Text><LockRating score={googleRoute.safetyAssessment?.estrellas ?? 1} color="rgb(255, 122, 0)" /></View>
                  <View style={styles.protoRight}><Text style={styles.protoTime}>{googleRoute.durationText || 'N/D'}</Text>{activeRouteType === 'google' && (<TouchableOpacity style={styles.protoStartButton2} onPress={() => setEnViaje(true)}><Text style={styles.protoStartText}>Iniciar</Text></TouchableOpacity>)}</View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {alertMessage && (
        <View style={styles.customAlertOverlay}>
          <View style={styles.customAlertBox}>
            <Text style={styles.customAlertTitle}>
              {alertMessage.includes('AMBA') ? 'Fuera de zona' : 'Mensaje'}
            </Text>
            <Text style={styles.customAlertText}>{alertMessage}</Text>
            <TouchableOpacity style={styles.customAlertButton} onPress={() => setAlertMessage(null)}>
              <Text style={styles.customAlertButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal animationType="slide" transparent visible={showFeedbackModal} onRequestClose={cerrarFeedback}>
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>¡Llegaste a tu destino!</Text>
              <TouchableOpacity onPress={cerrarFeedback} style={styles.closeButton}><MaterialCommunityIcons name="close" size={24} color="#64748B" /></TouchableOpacity>
            </View>

            <View style={styles.tripInfoContainer}>
              <View style={styles.tripInfoRow}><MaterialCommunityIcons name="map-marker-outline" size={20} color="#1D2DA4" /><Text style={styles.tripInfoText} numberOfLines={1}><Text style={styles.bold}>De:</Text> {resumenViaje.origen}</Text></View>
              <View style={styles.tripInfoRow}><MaterialCommunityIcons name="map-marker-check" size={20} color="#1D2DA4" /><Text style={styles.tripInfoText} numberOfLines={1}><Text style={styles.bold}>A:</Text> {resumenViaje.destino}</Text></View>
              <View style={styles.tripInfoRow}><MaterialCommunityIcons name="clock-outline" size={20} color="#1D2DA4" /><Text style={styles.tripInfoText}><Text style={styles.bold}>Duración:</Text> {resumenViaje.duracion}</Text></View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.ratingTitle}>¿Cómo te sentiste en esta ruta?</Text>
            <View style={styles.starsContainer}>{[1,2,3,4,5].map((star) => (<TouchableOpacity key={star} onPress={() => setRating(star)}><MaterialCommunityIcons name={rating >= star ? 'star' : 'star-outline'} size={40} color="rgb(255, 122, 0)" /></TouchableOpacity>))}</View>

            <TextInput style={styles.commentInput} placeholder="Dejanos un comentario (opcional)..." placeholderTextColor="#94A3B8" multiline numberOfLines={4} value={comentario} onChangeText={setComentario} textAlignVertical="top" />

            <TouchableOpacity style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]} onPress={enviarFeedback} disabled={rating === 0}><Text style={styles.submitButtonText}>Enviar Feedback</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SEARCH_TOP = 16;
const SEARCH_BAR_HEIGHT = 44;
const SUGGESTIONS_TOP = SEARCH_TOP + SEARCH_BAR_HEIGHT + 6;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    position: 'absolute',
    top: SEARCH_TOP,
    left: 18,
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
  protoRowActive: { backgroundColor: '#F0F3FF' },
  protoLeft: { flexDirection: 'column', gap: 4 },
  protoTitle: { fontSize: 16, fontWeight: '700', color: '#1D2DA4' },
  protoRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  protoTime: { fontSize: 15, fontWeight: '600', color: '#000' },
  protoStartButton: { backgroundColor: '#1D2DA4', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  protoStartButton2: { backgroundColor: 'rgb(255, 122, 0)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  protoStartText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  customAlertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customAlertBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  customAlertTitle: { fontSize: 18, fontWeight: '700', color: '#1D2DA4', marginBottom: 10 },
  customAlertText: { fontSize: 15, color: '#4A5568', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  customAlertButton: { backgroundColor: '#1D2DA4', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center' },
  customAlertButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  feedbackCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  feedbackTitle: { fontSize: 20, fontWeight: '800', color: '#1D2DA4' },
  closeButton: { padding: 4 },
  tripInfoContainer: { backgroundColor: '#F5F8FF', padding: 16, borderRadius: 12, gap: 8 },
  tripInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tripInfoText: { fontSize: 14, color: '#334155', flex: 1 },
  bold: { fontWeight: '700', color: '#1A202C' },
  divider: { height: 1, backgroundColor: '#EEF2F8', marginVertical: 20 },
  ratingTitle: { fontSize: 16, fontWeight: '600', color: '#1A202C', textAlign: 'center', marginBottom: 12 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 20,
    color: '#1A202C',
  },
  submitButton: { backgroundColor: '#1D2DA4', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#A0ABDB' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  activeTripContainer: { padding: 16, alignItems: 'center', backgroundColor: '#fff' },
  activeTripHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  activeTripTitle: { fontSize: 16, fontWeight: '700', color: '#1D2DA4' },
  endTripButton: { backgroundColor: '#EF4444', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  endTripText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});