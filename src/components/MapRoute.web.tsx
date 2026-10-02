import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LatLng, RouteResult } from '../services/googleApi';
import { RutaSegura } from '../services/safeliApi';
import { splitRouteByProgress } from '../services/routeUtils';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface FitBoundsProps {
  safeliRoute: RutaSegura | null;
  googleRoute: RouteResult | null;
}

// Escala la vista del mapa para englobar de manera óptima ambas opciones de ruta
function FitBounds({ safeliRoute, googleRoute }: FitBoundsProps) {
  const map = useMap();
  
  useEffect(() => {
    const group = new L.FeatureGroup();

    if (safeliRoute?.geometry?.coordinates) {
      try {
        const safeliLayer = L.geoJSON(safeliRoute.geometry as any);
        group.addLayer(safeliLayer);
      } catch (e) { console.warn(e); }
    }

    if (googleRoute?.polylinePoints && googleRoute.polylinePoints.length > 0) {
      const latLngs = googleRoute.polylinePoints.map(p => [p.latitude, p.longitude] as [number, number]);
      const googleLayer = L.polyline(latLngs);
      group.addLayer(googleLayer);
    }

    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [safeliRoute, googleRoute, map]);

  return null;
}

class GeoJSONErrorBoundary extends React.Component<{ children: React.ReactNode; data: any }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error('Error dibujando GeoJSON Safeli:', error); }
  render() { if (this.state.hasError) return null; return this.props.children; }
}

interface Props {
  userLocation: LatLng;
  destination: LatLng | null;
  safeliRoute: RutaSegura | null;
  googleRoute: RouteResult | null;
  activeRouteType: 'safeli' | 'google';
  onSelectRoute: (type: 'safeli' | 'google') => void;
  onMapPress?: (location: LatLng) => void; // <-- Nueva prop
}

// Componente auxiliar para registrar el evento click en Leaflet
function MapClickHandler({ onMapPress }: { onMapPress?: (location: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (onMapPress) {
        onMapPress({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function MapRouteWeb({
  userLocation,
  destination,
  safeliRoute,
  googleRoute,
  activeRouteType,
  onSelectRoute,
  onMapPress
}: Props) {
  
  // Puntos Safeli en formato LatLng
  const safeliPoints: LatLng[] = safeliRoute?.geometry?.coordinates
    ? safeliRoute.geometry.coordinates.map((c: [number, number]) => ({ latitude: c[1], longitude: c[0] }))
    : [];

  // Puntos Google/ORS en formato LatLng
  const googlePoints: LatLng[] = googleRoute?.polylinePoints || [];

  // Puntos de la ruta activa y separación por progreso
  const activePoints = activeRouteType === 'safeli' ? safeliPoints : googlePoints;
  const { traveled, remaining } = splitRouteByProgress(userLocation, activePoints);

  const traveledLeaflet = traveled.map(p => [p.latitude, p.longitude] as [number, number]);
  const remainingLeaflet = remaining.map(p => [p.latitude, p.longitude] as [number, number]);

  const inactiveGoogleLeaflet = googlePoints.map(p => [p.latitude, p.longitude] as [number, number]);
  const inactiveSafeliLeaflet = safeliPoints.map(p => [p.latitude, p.longitude] as [number, number]);

  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <MapClickHandler onMapPress={onMapPress} />

      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[userLocation.latitude, userLocation.longitude]} />

      {destination && (
        <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon} />
      )}

      {/* RUTA NO ACTIVA */}
      {activeRouteType === 'safeli' && inactiveGoogleLeaflet.length > 0 && (
        <Polyline
          positions={inactiveGoogleLeaflet}
          pathOptions={{ color: '#FF7A00', opacity: 0.35, weight: 4 }}
          eventHandlers={{ click: () => onSelectRoute('google') }}
        />
      )}

      {activeRouteType === 'google' && inactiveSafeliLeaflet.length > 0 && (
        <Polyline
          positions={inactiveSafeliLeaflet}
          pathOptions={{ color: '#1D2DA4', opacity: 0.35, weight: 4 }}
          eventHandlers={{ click: () => onSelectRoute('safeli') }}
        />
      )}

      {/* RUTA ACTIVA: Recorrida (Baja opacidad) */}
      {traveledLeaflet.length > 1 && (
        <Polyline
          positions={traveledLeaflet}
          pathOptions={{
            color: activeRouteType === 'safeli' ? '#1D2DA4' : '#FF7A00',
            opacity: 0.25,
            weight: 5
          }}
        />
      )}

      {/* RUTA ACTIVA: Restante (Opacidad alta) */}
      {remainingLeaflet.length > 1 && (
        <Polyline
          positions={remainingLeaflet}
          pathOptions={{
            color: activeRouteType === 'safeli' ? '#1D2DA4' : '#FF7A00',
            opacity: 1.0,
            weight: 6
          }}
        />
      )}

      <FitBounds safeliRoute={safeliRoute} googleRoute={googleRoute} />
    </MapContainer>
  );
}