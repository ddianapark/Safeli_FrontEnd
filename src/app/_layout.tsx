import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Stack, useSegments, router } from 'expo-router';
import { AuthProvider, useAuth } from '../context/authContext';

import HomeIcon from '../components/icons/Home';
import FeedbackIcon from '../components/icons/Feedback';
import DestinosIcon from '../components/icons/Destinos';
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
function GlobalFooter({ currentSegment }: { currentSegment: string }) {

  return (
    <View style={styles.footerContainer}>
      {/* Barra superior del menú */}
      <View style={styles.tabBar}>
        
        {/* Inicio */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => router.push('/home')}
        >
          <HomeIcon />
          <Text style={[styles.tabText, currentSegment === 'home' && styles.tabTextActive]}>Inicio</Text>
        </TouchableOpacity>

        {/* Reportes */}
        <TouchableOpacity style={styles.tabItem} onPress={() => Alert.alert("Módulo en desarrollo")}>
          <FeedbackIcon />
          <Text style={styles.tabText}>Reportes</Text>
        </TouchableOpacity>

        {/* Botón Central SOS */}
        <View style={styles.sosContainer}>
          <TouchableOpacity style={styles.sosButton} activeOpacity={0.8}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Destinos */}
        <TouchableOpacity style={styles.tabItem} onPress={() => Alert.alert("Módulo en desarrollo")}>
          <DestinosIcon />
          <Text style={styles.tabText}>Destinos</Text>
        </TouchableOpacity>

        {/* Perfil */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => router.push('/perfil')}
        >
          <ProfileIcon />
          <Text style={[styles.tabText, currentSegment === 'perfil' && styles.tabTextActive]}>Perfil</Text>
        </TouchableOpacity>

      </View>

      {/* Bloque azul sólido inferior del prototipo */}
      <View style={styles.bottomBlueBar} />
    </View>
  );
}

// ─── INNER LAYOUT CON RENDER CONDICIONAL ─────────────────────────────────────
function RootLayout() {
  const { isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return <SplashLoader />;
  }

  // Obtenemos el segmento actual de la ruta activa
  const currentSegment = (segments[0] as string) ?? '';

  // Condición estricta: Solo mostrar en 'home' o 'perfil'
  const mostrarFooter = currentSegment === 'home' || currentSegment === 'perfil';

  return (
    <View style={styles.container}>
      <AuthGuard />
      
      {/* Contenedor principal de pantallas */}
      <View style={styles.screenContent}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {/* Render condicional del Footer integrado */}
      {mostrarFooter && <GlobalFooter currentSegment={currentSegment} />}
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
  
  // ESTILOS DEL MENÚ INFERIOR (PROTOTIPO)
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
    textDecorationLine: 'underline', // Destaca visualmente cuál está seleccionada
  },
  
  // CONTENEDOR FLOTANTE PARA EL SOS
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
    // Desplaza el botón hacia arriba rompiendo la línea como tu diseño
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
  
  // BARRA INFERIOR AZUL DE SOPORTE DE DISEÑO
  bottomBlueBar: {
    height: 28,
    backgroundColor: '#1A3FA8',
    width: '100%',
  },
});