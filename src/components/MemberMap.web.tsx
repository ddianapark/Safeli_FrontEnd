import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  latitude: number;
  longitude: number;
  title?: string;
}

export default function MemberMapWeb({ latitude, longitude, title }: Props) {
  return (
    <MapContainer
      key={`${latitude},${longitude}`}
      center={[latitude, longitude]}
      zoom={16}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[latitude, longitude]}>{title ? <Popup>{title}</Popup> : null}</Marker>
    </MapContainer>
  );
}