import { Platform } from 'react-native';
import MemberMap from './MemberMap.native';
import MemberMapWeb from './MemberMap.web';

const MapRoute = Platform.OS === 'web' ? MemberMapWeb : MemberMap;

export default MapRoute;