import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/authContext';

/**
 * home.tsx — pantalla principal post-login.
 * Reemplazá este archivo con tu pantalla real.
 * El AuthGuard en _layout.tsx protege esta ruta automáticamente.
 */
export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido/a, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1A3FA8',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});