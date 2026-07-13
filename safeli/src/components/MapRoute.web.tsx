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
  routeData: any; // Ahora recibe el objeto GeoJSON completo
}

function FitBounds({ routeData }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    // Verificamos que sea un GeoJSON válido con características (features)
    if (routeData && routeData.type === 'FeatureCollection' && routeData.features.length > 0) {
      // Usamos la utilidad nativa de Leaflet para calcular los límites del GeoJSON
      const geoJsonLayer = L.geoJSON(routeData);
      const bounds = geoJsonLayer.getBounds();
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }, [routeData, map]);
  return null;
}

interface Props {
  userLocation: LatLng;
  destination: LatLng | null;
  route: any; // Aceptamos cualquier objeto (el GeoJSON) en lugar de RouteResult
}

export default function MapRoute({ userLocation, destination, route }: Props) {
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

      {/* Marcador usuario */}
      <Marker position={[userLocation.latitude, userLocation.longitude]} />

      {/* Marcador destino */}
      {destination && (
        <Marker
          position={[destination.latitude, destination.longitude]}
          icon={destinationIcon}
        />
      )}

      {/* Renderizado de la ruta segura usando GeoJSON */}
      {route && route.route && (
      <>
        <GeoJSON 
          data={route.route} // Apuntamos a la propiedad 'route' del objeto que devuelve el backend
          style={{ color: '#1D3557', weight: 5 }} 
        />
        <FitBounds routeData={route.route} />
      </>
    )}
    </MapContainer>
  );
}