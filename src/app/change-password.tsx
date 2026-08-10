import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/authContext';

const SAFELI_BLUE = '#1F2B99';
const INPUT_BG = '#F0F7FF';

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Estados de visibilidad de contraseñas (Mejora de Seguridad y UX)
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePassword = () => {
    const nextErrors: Record<string, string> = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = 'Ingresá tu contraseña actual';
    }
    if (!passwordForm.newPassword) {
      nextErrors.newPassword = 'Ingresá una nueva contraseña';
    } else if (!passwordRegex.test(passwordForm.newPassword)) {
      nextErrors.newPassword = 'Mínimo 8 caracteres, una mayúscula, una minúscula y un número';
    }
    if (!passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Confirmá la nueva contraseña';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas nuevas no coinciden';
    }
    if (!ownerConfirmed) {
      nextErrors.ownerConfirmed = 'Confirmá que sos el titular de la cuenta';
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setIsChangingPassword(true);

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      const mensaje = 'Tu contraseña se cambió correctamente.';

      if (Platform.OS === 'web') {
        alert(`Éxito\n\n${mensaje}`);
        router.back();
      } else {
        Alert.alert('Contraseña actualizada', mensaje, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.';
      Alert.alert('No se pudo cambiar la contraseña', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header superior con botón volver */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={SAFELI_BLUE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Por razones de seguridad, ingresá tu contraseña actual antes de crear una nueva.
          </Text>

          {/* Contraseña Actual */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña actual"
              secureTextEntry={!showCurrent}
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, currentPassword: text }))}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrent((prev) => !prev)}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {passwordErrors.currentPassword ? <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text> : null}

          {/* Nueva Contraseña */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              secureTextEntry={!showNew}
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, newPassword: text }))}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNew((prev) => !prev)}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {passwordErrors.newPassword ? <Text style={styles.errorText}>{passwordErrors.newPassword}</Text> : null}

          {/* Confirmar Nueva Contraseña */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar nueva contraseña"
              secureTextEntry={!showConfirm}
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, confirmPassword: text }))}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm((prev) => !prev)}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {passwordErrors.confirmPassword ? <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text> : null}

          {/* Botón de envío */}
          <TouchableOpacity
            style={[styles.saveButton, isChangingPassword && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            <Text style={styles.saveButtonText}>
              {isChangingPassword ? 'Procesando...' : 'Guardar nueva contraseña'}
            </Text>
          </TouchableOpacity>

          {/* Link recuperación de contraseña */}
          <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPasswordLink}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EEF9',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: SAFELI_BLUE },
  contentContainer: { padding: 24 },
  card: {
    backgroundColor: '#F8FBFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4EEF9',
  },
  subtitle: { fontSize: 13, color: '#4B5563', marginBottom: 16, lineHeight: 18 },
  inputContainer: {
    position: 'relative',
    marginTop: 10,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 45,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DCE9F7',
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 12,
  },
  errorText: { color: '#E53E3E', fontSize: 12, marginTop: 4, marginLeft: 4 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: SAFELI_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: SAFELI_BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  forgotPasswordLink: { marginTop: 16, alignSelf: 'center' },
  forgotPasswordText: { color: SAFELI_BLUE, fontWeight: '700', textDecorationLine: 'underline' },
});