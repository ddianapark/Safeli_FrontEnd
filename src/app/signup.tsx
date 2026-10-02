import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../services/apiClient';

export default function SignUpScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    setErrorMessage(null);

    if (!email || !password || !nombre) {
      setErrorMessage('Por favor completá todos los campos requeridos.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/register', {
        nombre,
        email,
        password,
      });

      Alert.alert('¡Cuenta creada!', 'Tu usuario fue registrado exitosamente.', [
        { text: 'Iniciar Sesión', onPress: () => router.replace('/') },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al intentar registrar la cuenta.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Crear cuenta</Text>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor="#A0AEC0"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#A0AEC0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#A0AEC0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Registrarme</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/')} style={styles.linkButton}>
          <Text style={styles.linkText}>
            ¿Ya tenés una cuenta? <Text style={styles.linkBold}>Iniciá sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const SAFELI_BLUE = '#1A3FA8';
const SAFELI_LIGHT_BLUE = '#D6E4F7';

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F8FF' },
  header: { backgroundColor: SAFELI_BLUE, paddingTop: 56, paddingBottom: 24, alignItems: 'center' },
  logo: { width: 140, height: 70 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A202C', textAlign: 'center', marginBottom: 24 },
  errorBanner: { backgroundColor: '#FED7D7', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorBannerText: { color: '#9B2C2C', fontSize: 13, textAlign: 'center' },
  inputWrapper: { marginBottom: 16 },
  input: {
    backgroundColor: SAFELI_LIGHT_BLUE,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1A202C',
  },
  primaryButton: {
    backgroundColor: SAFELI_BLUE,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#4A5568', fontSize: 14 },
  linkBold: { color: SAFELI_BLUE, fontWeight: '700' },
});