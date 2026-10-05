import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack, useSegments, router } from 'expo-router';
import { AuthProvider, useAuth } from '../context/authContext';

import HomeIcon from '../components/icons/Home';
import FeedbackIcon from '../components/icons/Feedback';
import OrbitsIcon from '../components/icons/Orbits';
import ProfileIcon from '../components/icons/Profile';

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

function SplashLoader() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={SAFELI_BLUE} />
    </View>
  );
}

// ─── COMPONENTE GLOBAL DEL FOOTER ────────────────────────────────
function GlobalFooter({ currentSegment, onShowAlert }: { currentSegment: string, onShowAlert: (nombre: string) => void }) {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.tabBar}>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => router.push('/home')}
        >
          <HomeIcon />
          <Text style={[styles.tabText, currentSegment === 'home' && styles.tabTextActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onShowAlert('Reportes')}>
          <FeedbackIcon />
          <Text style={styles.tabText}>Reportes</Text>
        </TouchableOpacity>

        <View style={styles.sosContainer}>
          <TouchableOpacity style={styles.sosButton} onPress={() => onShowAlert('SOS')} activeOpacity={0.8}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/orbits')}>
          <OrbitsIcon />
          <Text style={styles.tabText}>Orbits</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/perfil')}>
          <ProfileIcon />
          <Text style={[styles.tabText, currentSegment === 'perfil' && styles.tabTextActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── INNER LAYOUT CON RENDER CONDICIONAL ─────────────────────────────────────
function RootLayout() {
  const { isLoading } = useAuth();
  const segments = useSegments();
  
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  if (isLoading) {
    return <SplashLoader />;
  }

  const currentSegment = (segments[0] as string) ?? '';
  const mostrarFooter = currentSegment === 'home' || currentSegment === 'perfil';

  const handlePlaceholderPress = (nombreBoton: string) => {
    setAlertMessage(`La sección de "${nombreBoton}" estará disponible próximamente.`);
  };

  return (
    <View style={styles.container}>
      <AuthGuard />

      <View style={styles.globalBlueBar} />

      <View style={styles.screenContent}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {mostrarFooter && <GlobalFooter currentSegment={currentSegment} onShowAlert={handlePlaceholderPress} />}

      <View style={styles.globalBlueBar} />

      {alertMessage && (
        <View style={styles.customAlertOverlay}>
          <View style={styles.customAlertBox}>
            <Text style={styles.customAlertTitle}>Módulo en Desarrollo</Text>
            <Text style={styles.customAlertText}>{alertMessage}</Text>
            
            <TouchableOpacity 
              style={styles.customAlertButton} 
              onPress={() => setAlertMessage(null)} 
            >
              <Text style={styles.customAlertButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  screenContent: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: '#F5F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalBlueBar: {
    height: 28,
    backgroundColor: '#1A3FA8',
    width: '100%',
    zIndex: 1000,
  },
  footerContainer: {
    backgroundColor: '#F3F7FF',
    zIndex: 999,
  },
  tabBar: {
    flexDirection: 'row',
    height: 65,
    backgroundColor: '#F3F7FF',
    borderTopWidth: 2,
    borderTopColor: '#1A3FA8',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
    marginTop: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A3FA8',
  },
  tabTextActive: {
    textDecorationLine: 'underline', 
  },
  sosContainer: {
    width: 75,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  sosButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F3F7FF',
    borderWidth: 3,
    borderColor: '#BC0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -35, 
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 4,
  },
  sosText: {
    color: '#BC0000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  customAlertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    zIndex: 9999, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  customAlertBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8
  },
  customAlertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2DA4', 
    marginBottom: 10
  },
  customAlertText: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  customAlertButton: {
    backgroundColor: '#1D2DA4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  customAlertButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
});