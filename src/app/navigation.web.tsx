import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapRoute from '../components/MapRoute';
import { ORSGeoJSON } from '../types/navigation_types';

interface Props {
  routeData: ORSGeoJSON;
  onFinishNavigation: () => void;
}

export default function RealTimeNavigationScreenWeb({ routeData }: Props) {
  const feature = routeData.features[0];
  const coordinates = feature.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

  return (
    <View style={styles.container}>
      <MapRoute
        userLocation={coordinates.length > 0 ? coordinates[0] : { latitude: 0, longitude: 0 }}
        destination={coordinates.length > 0 ? coordinates[coordinates.length - 1] : null}
        safeliRoute={null}
        googleRoute={{ polylinePoints: coordinates, durationText: '', safetyAssessment: { estrellas: 1 } } as any}
        activeRouteType={'google'}
        onSelectRoute={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
