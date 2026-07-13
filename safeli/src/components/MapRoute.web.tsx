import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LatLng } from '../services/googleApi';

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
  routeData: any;
}

function FitBounds({ routeData }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    if (!routeData) return;
    try {
      const geoJsonLayer = L.geoJSON(routeData);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    } catch (e) {
      console.warn('No se pudieron calcular los límites de la ruta', e);
    }
  }, [routeData, map]);
  return null;
}

// ─── Error boundary para que un dato de ruta malformado no tumbe toda la pantalla ───
class GeoJSONErrorBoundary extends React.Component
<{ children: React.ReactNode; data: any }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error('❌ Error dibujando la ruta. Geometry recibida:', JSON.stringify(this.props.data));
    console.error(error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface Props {
  userLocation: LatLng;
  destination: LatLng | null;
  route: any;
}

export default function MapRoute({ userLocation, destination, route }: Props) {
  const hasValidGeometry =
    route?.geometry?.type && Array.isArray(route.geometry.coordinates);

  useEffect(() => {
    if (route) {
      console.log('ROUTE RECIBIDO EN MAPA:', JSON.stringify(route.geometry?.type), route.geometry);
    }
  }, [route]);

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
        <Marker
          position={[destination.latitude, destination.longitude]}
          icon={destinationIcon}
        />
      )}

      {hasValidGeometry && (
        <GeoJSONErrorBoundary data={route.geometry}>
          <GeoJSON
            key={JSON.stringify(route.geometry).length}
            data={route.geometry}
            style={{ color: '#1D3557', weight: 5 }}
          />
          <FitBounds routeData={route.geometry} />
        </GeoJSONErrorBoundary>
      )}
    </MapContainer>
  );
}