import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface Props {
  latitude: number;
  longitude: number;
  title?: string;
}

export default function MemberMap({ latitude, longitude, title }: Props) {
  return (
    <MapView
      key={`${latitude},${longitude}`}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={{ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
    >
      <Marker coordinate={{ latitude, longitude }} title={title} />
    </MapView>
  );
}