import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { useAuth } from '../context/authContext';
import { UpdateProfileRequest } from '../types/auth_types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SAFELI_BLUE = '#1F2B99';
const INPUT_BG = '#F0F7FF';

export default function ProfileScreen() {
  const { user, logout, updateProfile, changePassword } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    birthDate: '',
    nroTelefono: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        birthDate: user.birthDate ?? '',
        nroTelefono: user.nroTelefono ? String(user.nroTelefono) : '',
      });
    }
  }, [user]);

  const fotoPerfil = useMemo(() => {
    if (user?.foto && user.foto !== '-1') {
      return { uri: user.foto };
    }
    return require('../../assets/images/default.jpg');
  }, [user?.foto]);

  const handlePlaceholderPress = (nombreBoton: string) => {
    const mensaje = `La sección de "${nombreBoton}" estará disponible próximamente.`;

    if (Platform.OS === 'web') {
      alert(`Módulo en Desarrollo\n\n${mensaje}`);
    } else {
      Alert.alert('Módulo en Desarrollo', mensaje);
    }
  };

  const validateProfile = () => {
    const nextErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!profileForm.firstName.trim()) nextErrors.firstName = 'Ingresá tu nombre';
    if (!profileForm.lastName.trim()) nextErrors.lastName = 'Ingresá tu apellido';
    if (!profileForm.username.trim()) nextErrors.username = 'Ingresá un nombre de usuario';
    if (!profileForm.email.trim()) {
      nextErrors.email = 'Ingresá tu email';
    } else if (!emailRegex.test(profileForm.email)) {
      nextErrors.email = 'El email no es válido';
    }
    if (profileForm.nroTelefono && !/^\d{10}$/.test(profileForm.nroTelefono)) {
      nextErrors.nroTelefono = 'El teléfono debe tener 10 dígitos';
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setIsSavingProfile(true);

    try {
      const payload: UpdateProfileRequest = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim().toLowerCase(),
        birthDate: profileForm.birthDate.trim() || undefined,
        nroTelefono: profileForm.nroTelefono.trim() ? Number(profileForm.nroTelefono.trim()) : null,
      };

      await updateProfile(payload);
      setIsEditing(false);
      Alert.alert('Perfil actualizado', 'Tu información se guardó correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el perfil.';
      Alert.alert('No se pudo actualizar', message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const validatePassword = () => {
    const nextErrors: Record<string, string> = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordForm.currentPassword) nextErrors.currentPassword = 'Ingresá tu contraseña actual';
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
    if (!ownerConfirmed) nextErrors.ownerConfirmed = 'Confirmá que sos el titular de la cuenta';

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
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOwnerConfirmed(false);
      Alert.alert('Contraseña actualizada', 'Tu contraseña se cambió correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.';
      Alert.alert('No se pudo cambiar la contraseña', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBlueHeader} />

      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/logotipo_color.png')} style={styles.logo} />
      </View>

      <TouchableOpacity
        style={styles.settingsGear}
        onPress={() => handlePlaceholderPress('Configuración Avanzada')}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={32} color={SAFELI_BLUE} />
      </TouchableOpacity>

      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Image source={fotoPerfil} style={styles.avatarCircle} />
        </View>
      </View>

      <View style={styles.usernameRow}>
        <Text style={styles.usernameText}>
          {user?.username || 'Usuario Safeli'}
        </Text>
      </View>

      {/* Acordeón de información del usuario */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsInfoExpanded((prev) => !prev);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.accordionHeaderLeft}>
            <Ionicons name="person-circle-outline" size={22} color={SAFELI_BLUE} />
            <Text style={styles.accordionHeaderText}>Información personal</Text>
          </View>
          <View style={styles.accordionHeaderRight}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                if (isEditing) {
                  setIsEditing(false);
                  if (user) {
                    setProfileForm({
                      firstName: user.firstName ?? '',
                      lastName: user.lastName ?? '',
                      username: user.username ?? '',
                      email: user.email ?? '',
                      birthDate: user.birthDate ?? '',
                      nroTelefono: user.nroTelefono ? String(user.nroTelefono) : '',
                    });
                  }
                } else {
                  setIsEditing(true);
                  if (!isInfoExpanded) {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsInfoExpanded(true);
                  }
                }
              }}
            >
              <Ionicons name={isEditing ? 'close' : 'pencil'} size={16} color="#000" style={styles.pencilIcon} />
            </TouchableOpacity>
            <Ionicons
              name={isInfoExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={SAFELI_BLUE}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {isInfoExpanded && (
          <View style={styles.fieldsContainer}>
            {isEditing ? (
              <>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profileForm.firstName}
                    placeholder="Nombre"
                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, firstName: text }))}
                  />
                  {profileErrors.firstName ? <Text style={styles.errorText}>{profileErrors.firstName}</Text> : null}
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profileForm.lastName}
                    placeholder="Apellido"
                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, lastName: text }))}
                  />
                  {profileErrors.lastName ? <Text style={styles.errorText}>{profileErrors.lastName}</Text> : null}
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profileForm.username}
                    placeholder="Nombre de usuario"
                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, username: text }))}
                  />
                  {profileErrors.username ? <Text style={styles.errorText}>{profileErrors.username}</Text> : null}
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profileForm.email}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, email: text }))}
                  />
                  {profileErrors.email ? <Text style={styles.errorText}>{profileErrors.email}</Text> : null}
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profileForm.birthDate}
                    placeholder="Fecha de nacimiento (YYYY-MM-DD)"
                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, birthDate: text }))}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profileForm.nroTelefono}
                    placeholder="Teléfono"
                    keyboardType="number-pad"
                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, nroTelefono: text }))}
                  />
                  {profileErrors.nroTelefono ? <Text style={styles.errorText}>{profileErrors.nroTelefono}</Text> : null}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? <Text style={styles.saveButtonText}>Guardando...</Text> : <Text style={styles.saveButtonText}>Guardar cambios</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{user?.firstName || 'Sin completar'}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Apellido</Text>
                  <Text style={styles.infoValue}>{user?.lastName || 'Sin completar'}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Nombre de usuario</Text>
                  <Text style={styles.infoValue}>{user?.username || 'Sin completar'}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Sin completar'}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
                  <Text style={styles.infoValue}>{user?.birthDate || 'Sin completar'}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{user?.nroTelefono ? String(user.nroTelefono) : 'Sin completar'}</Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.passwordCard}>
        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña actual"
          secureTextEntry
          value={passwordForm.currentPassword}
          onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, currentPassword: text }))}
        />
        {passwordErrors.currentPassword ? <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          secureTextEntry
          value={passwordForm.newPassword}
          onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, newPassword: text }))}
        />
        {passwordErrors.newPassword ? <Text style={styles.errorText}>{passwordErrors.newPassword}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Confirmar nueva contraseña"
          secureTextEntry
          value={passwordForm.confirmPassword}
          onChangeText={(text) => setPasswordForm((prev) => ({ ...prev, confirmPassword: text }))}
        />
        {passwordErrors.confirmPassword ? <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text> : null}

        <TouchableOpacity style={styles.ownerRow} onPress={() => setOwnerConfirmed((prev) => !prev)} activeOpacity={0.8}>
          <View style={[styles.checkbox, ownerConfirmed && styles.checkboxChecked]}>
            {ownerConfirmed ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.ownerText}>Confirmo que soy el titular de esta cuenta.</Text>
        </TouchableOpacity>
        {passwordErrors.ownerConfirmed ? <Text style={styles.errorText}>{passwordErrors.ownerConfirmed}</Text> : null}

        <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword} disabled={isChangingPassword}>
          {isChangingPassword ? <Text style={styles.saveButtonText}>Procesando...</Text> : <Text style={styles.saveButtonText}>Guardar nueva contraseña</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPasswordLink}>
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Ajustes</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.pillButton} onPress={() => handlePlaceholderPress('Destinos')} activeOpacity={0.7}>
          <Text style={styles.pillButtonText}>Destinos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pillButton} onPress={() => handlePlaceholderPress('Orbit')} activeOpacity={0.7}>
          <Text style={styles.pillButtonText}>Orbit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pillButton} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.pillButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { paddingBottom: 40 },
  topBlueHeader: { height: Platform.OS === 'web' ? 40 : 50, backgroundColor: '#1A3FA8', width: '100%' },
  logoContainer: { alignItems: 'center', marginTop: 25, marginBottom: 5 },
  logo: { width: 200, height: 60, resizeMode: 'contain' },
  settingsGear: { alignSelf: 'flex-start', marginLeft: 28, marginTop: 5, marginBottom: 10 },
  avatarContainer: { alignItems: 'center', marginVertical: 15 },
  avatarCircle: { width: 170, height: 170, borderRadius: 85, borderWidth: 2, borderColor: '#1A3FA8', backgroundColor: '#E0E6ED', justifyContent: 'center', alignItems: 'center' },
  usernameRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
  usernameText: { fontSize: 18, fontWeight: '600', color: '#333' },
  pencilIcon: { marginTop: 2 },
  accordionContainer: { marginHorizontal: 24, marginBottom: 20, borderRadius: 16, borderWidth: 1, borderColor: '#DCE9F7', overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: INPUT_BG, paddingHorizontal: 14, paddingVertical: 14 },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accordionHeaderText: { fontSize: 15, fontWeight: '700', color: SAFELI_BLUE },
  accordionHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  fieldsContainer: { paddingHorizontal: 14, paddingVertical: 14, gap: 12, backgroundColor: '#fff' },
  inputWrapper: { gap: 4 },
  input: { backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#DCE9F7' },
  infoCard: { backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 2 },
  infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  infoValue: { fontSize: 15, color: '#111827', fontWeight: '600' },
  errorText: { color: '#E53E3E', fontSize: 12, marginLeft: 4 },
  saveButton: { backgroundColor: SAFELI_BLUE, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: '#fff', fontWeight: '700' },
  passwordCard: { marginHorizontal: 24, marginBottom: 24, backgroundColor: '#F8FBFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E4EEF9' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: SAFELI_BLUE, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkboxChecked: { backgroundColor: SAFELI_BLUE },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ownerText: { fontSize: 13, color: '#374151' },
  forgotPasswordLink: { marginTop: 8, alignSelf: 'center' },
  forgotPasswordText: { color: SAFELI_BLUE, fontWeight: '700', textDecorationLine: 'underline' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 16 },
  buttonsContainer: { paddingHorizontal: 60, gap: 14, alignItems: 'center', marginBottom: 16 },
  pillButton: { width: '100%', maxWidth: 260, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#1A3FA8', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  pillButtonText: { color: '#1A3FA8', fontSize: 16, fontWeight: '600' },
});