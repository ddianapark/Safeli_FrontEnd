import { Platform } from 'react-native';
import MapRouteNative from './MapRoute.native';
import MapRouteWeb from './MapRoute.web';

const MapRoute = Platform.OS === 'web' ? MapRouteWeb : MapRouteNative;

export default MapRoute;
