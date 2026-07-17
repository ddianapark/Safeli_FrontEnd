import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LatLng, RouteResult } from '../services/googleApi';
import { RutaSegura } from '../services/safeliApi';

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
}

export default function MapRouteWeb({
  userLocation,
  destination,
  safeliRoute,
  googleRoute,
  activeRouteType,
  onSelectRoute
}: Props) {

  const hasSafeliGeometry = safeliRoute?.geometry?.type && Array.isArray(safeliRoute.geometry.coordinates);
  
  // Transformación del polyline de Google a arrays para Leaflet ([lat, lng])
  const googleLeafletCoords = googleRoute?.polylinePoints
    ? googleRoute.polylinePoints.map(p => [p.latitude, p.longitude] as [number, number])
    : [];

  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[userLocation.latitude, userLocation.longitude]} />

      {destination && (
        <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon} />
      )}

      {/* 1. CAPA DE GOOGLE (CAMINO RÁPIDO) */}
      {googleLeafletCoords.length > 0 && (
        <Polyline
          positions={googleLeafletCoords}
          pathOptions={{
            color: activeRouteType === 'google' ? '#FF7A00' : '#A0A0A0',
            weight: activeRouteType === 'google' ? 6 : 4,
            opacity: activeRouteType === 'google' ? 1.0 : 0.4
          }}
          eventHandlers={{
            click: () => onSelectRoute('google')
          }}
        />
      )}

      {/* 2. CAPA DE SAFELI (CAMINO SEGURO) */}
      {hasSafeliGeometry && (
        <GeoJSONErrorBoundary data={safeliRoute.geometry}>
          <GeoJSON
            key={`safeli-web-${activeRouteType}-${JSON.stringify(safeliRoute.geometry).length}`}
            data={safeliRoute.geometry as any}
            style={() => ({
              color: activeRouteType === 'safeli' ? '#1D2DA4' : '#A0A0A0',
              weight: activeRouteType === 'safeli' ? 6 : 4,
              opacity: activeRouteType === 'safeli' ? 1.0 : 0.4
            })}
            eventHandlers={{
              click: () => onSelectRoute('safeli')
            }}
          />
        </GeoJSONErrorBoundary>
      )}

      {/* Componente dinámico de encuadre */}
      <FitBounds safeliRoute={safeliRoute} googleRoute={googleRoute} />
    </MapContainer>
  );
}