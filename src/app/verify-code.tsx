import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { authService } from '../services/authService';

export default function VerifyCodeScreen() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    if (!code.trim()) {
      Alert.alert('Error', 'Ingresá el código enviado por email');
      return false;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      // first verify code (mock will noop)
      await authService.verifyCode({ email: String(email), code: code.trim() });
      // then reset password
      await authService.resetPassword({
        email: String(email),
        code: code.trim(),
        newPassword,
      });
      Alert.alert('Listo', 'Contraseña actualizada. Iniciá sesión con la nueva contraseña.');
      router.replace('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al reestablecer contraseña';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.navigate('/');
                }
              }} 
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
        </View>

      <View style={styles.body}>
        <Text style={styles.title}>Restablecer contraseña</Text>
        <Text style={styles.subtitle}>Te enviamos un código a: {email}</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Código"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Confirmar</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const SAFELI_BLUE = '#1A3FA8';
const SAFELI_LIGHT_BLUE = '#D6E4F7';

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F8FF' },
  body: { paddingHorizontal: 28, paddingTop: 36, zIndex: 1, },
  title: { fontSize: 22, fontWeight: '700', color: '#1A202C', marginBottom: 8 },
  subtitle: { color: '#4A5568', marginBottom: 20 },
  inputWrapper: { marginBottom: 14 },
  input: { backgroundColor: '#D6E4F7', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  primaryButton: { backgroundColor: '#1A3FA8', borderRadius: 25, paddingVertical: 14, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 10,
    padding: 12,
    zIndex: 999,
    cursor: 'pointer',
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  header: {
    backgroundColor: SAFELI_BLUE,
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  }
});
