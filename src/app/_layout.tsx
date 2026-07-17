import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useSegments, router } from 'expo-router';
import { AuthProvider, useAuth } from '../context/authContext';

const SAFELI_BLUE = '#1A3FA8';

// Rutas públicas — accesibles sin sesión
const PUBLIC_ROUTES = new Set(['index', 'signup', 'forgot-password', 'verify-code', 'reset-password']);

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const currentSegment = (segments[0] as string) ?? 'index';
    const inPublicRoute = PUBLIC_ROUTES.has(currentSegment);

    if (!isAuthenticated && !inPublicRoute) {
      router.replace('/');
    } else if (isAuthenticated && inPublicRoute) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function SplashLoader() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={SAFELI_BLUE} />
    </View>
  );
}

// ─── Inner layout (necesita acceso al AuthContext) ────────────────────────────
function RootLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SplashLoader />;
  }

  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function Layout() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#F5F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});