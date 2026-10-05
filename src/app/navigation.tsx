import { Platform } from 'react-native';

let Screen: any;
if (Platform.OS === 'web') {
  // Web-specific implementation
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Screen = require('./navigation.web').default;
} else {
  // Native implementation
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Screen = require('./navigation.native').default;
}

export default Screen;
