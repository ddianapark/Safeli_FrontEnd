import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

const DURATION = 300;

export function AnimatedSplashOverlay() {
  return null;
}

const keyframe = new Keyframe({
  0: { transform: [{ scale: 0 }] },
  60: { transform: [{ scale: 1.2 }] },
  100: { transform: [{ scale: 1 }] },
});

const logoKeyframe = new Keyframe({
  0: { opacity: 0 },
  60: { transform: [{ scale: 1.2 }], opacity: 0 },
  100: { transform: [{ scale: 1 }], opacity: 1 },
});

const glowKeyframe = new Keyframe({
  0: { transform: [{ rotateZ: '0deg' }] },
  100: { transform: [{ rotateZ: '7200deg' }] },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('../../assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={styles.background} entering={keyframe.duration(DURATION)}>
        <View style={styles.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('../../assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: { justifyContent: 'center', alignItems: 'center' },
  glow: { width: 201, height: 201, position: 'absolute' },
  iconContainer: { justifyContent: 'center', alignItems: 'center', width: 128, height: 128 },
  image: { position: 'absolute', width: 76, height: 71 },
  background: { width: 128, height: 128, position: 'absolute', borderRadius: 40, backgroundColor: '#3C9FFE' },
  expoLogoBackground: { width: 128, height: 128, borderRadius: 40, backgroundColor: '#0274DF' },
});
