import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useAuth } from '../context/authContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SAFELI_BLUE = '#1F2B99';
const INPUT_BG = '#F0F7FF';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estado para la imagen local seleccionada por el usuario
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    birthDate: '',
    nroTelefono: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? (user as any).nombre ?? '',
        lastName: user.lastName ?? (user as any).apellido ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        birthDate: user.birthDate ?? (user as any).fechaNacimiento ?? '',
        nroTelefono: user.nroTelefono ? String(user.nroTelefono) : '',
      });
    }
  }, [user]);

  // Imagen computada: muestra la seleccionada localmente, la de la BD o la por defecto
  const fotoPerfil = useMemo(() => {
    if (selectedImage) {
      return { uri: selectedImage };
    }
    if (user?.foto && user.foto !== '-1') {
      return { uri: user.foto };
    }
    return require('../../assets/images/default.jpg');
  }, [selectedImage, user?.foto]);

  // Función para abrir la galería / archivos
  const seleccionarFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

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
      const formData = new FormData();
      formData.append('firstName', profileForm.firstName.trim());
      formData.append('lastName', profileForm.lastName.trim());
      formData.append('username', profileForm.username.trim());
      formData.append('email', profileForm.email.trim().toLowerCase());

      if (profileForm.birthDate.trim()) {
        formData.append('birthDate', profileForm.birthDate.trim());
      }
      if (profileForm.nroTelefono.trim()) {
        formData.append('nroTelefono', profileForm.nroTelefono.trim());
      }

      // 💻 PROCESAMIENTO DE IMAGEN
      if (selectedImage && !selectedImage.startsWith('http')) {
        if (Platform.OS === 'web') {
          // Web (PC): Obtener Blob desde el URI de la vista previa
          const res = await fetch(selectedImage);
          const blob = await res.blob();
          formData.append('foto', blob, 'perfil.jpg');
        } else {
          // Móvil
          const fileName = selectedImage.split('/').pop() || 'perfil.jpg';
          const match = /\.(\w+)$/.exec(fileName);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('foto', {
            uri: selectedImage,
            name: fileName,
            type: type,
          } as any);
        }
      }

      // Envío al servidor
      await updateProfile(formData as any);

      // Limpiamos el estado temporal de la imagen guardada
      setSelectedImage(null);
      setIsEditing(false);

      if (Platform.OS === 'web') {
        alert('¡Foto y perfil guardados correctamente!');
      } else {
        Alert.alert('¡Éxito!', '¡Foto y perfil guardados correctamente!');
      }
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      if (Platform.OS === 'web') {
        alert('No se pudo actualizar el perfil ni guardar la imagen.');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el perfil.');
      }
    } finally {
      setIsSavingProfile(false);
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

      {/* 📷 FOTO DE PERFIL */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Image source={fotoPerfil} style={styles.avatarImage} />

          <TouchableOpacity
            style={styles.cameraBadge}
            onPress={seleccionarFoto}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 🔘 BOTÓN QUE APARECE SOLO AL ELEGIR UNA NUEVA FOTO */}
        {selectedImage && (
          <View style={styles.photoActionsContainer}>
            <TouchableOpacity
              style={styles.savePhotoButton}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.savePhotoButtonText}>
                {isSavingProfile ? 'Guardando foto...' : 'Guardar nueva foto'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelPhotoButton}
              onPress={() => setSelectedImage(null)}
              disabled={isSavingProfile}
            >
              <Ionicons name="close-circle-outline" size={18} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.usernameRow}>
        <Text style={styles.usernameText}>
          {user?.username || 'Usuario Safeli'}
        </Text>
      </View>

      {/* Información del usuario */}
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
                  setSelectedImage(null);
                  if (user) {
                    setProfileForm({
                      firstName: user.firstName ?? (user as any).nombre ?? '',
                      lastName: user.lastName ?? (user as any).apellido ?? '',
                      username: user.username ?? '',
                      email: user.email ?? '',
                      birthDate: user.birthDate ?? (user as any).fechaNacimiento ?? '',
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
                  <Text style={styles.infoValue}>
                    {user?.firstName || (user as any)?.nombre || 'Sin completar'}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Apellido</Text>
                  <Text style={styles.infoValue}>
                    {user?.lastName || (user as any)?.apellido || 'Sin completar'}
                  </Text>
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
                  <Text style={styles.infoValue}>
                    {user?.birthDate || (user as any)?.fechaNacimiento || 'Sin completar'}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>
                    {user?.nroTelefono ? String(user.nroTelefono) : 'Sin completar'}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Contraseña</Text>
                  <Text style={styles.infoValue}>••••••••</Text>
                </View>

                <TouchableOpacity
                  style={styles.changePasswordOption}
                  onPress={() => router.push('/change-password')}
                  activeOpacity={0.7}
                >
                  <View style={styles.changePasswordLeft}>
                    <Ionicons name="key-outline" size={18} color={SAFELI_BLUE} />
                    <Text style={styles.changePasswordText}>Cambiar contraseña</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={SAFELI_BLUE} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
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
  avatarCircle: { 
    width: 170, 
    height: 170, 
    borderRadius: 85, 
    borderWidth: 2, 
    borderColor: '#1A3FA8', 
    backgroundColor: '#E0E6ED', 
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'  
  },
  avatarImage: { width: 166, height: 166, borderRadius: 83 },
  cameraBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#1A3FA8',
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  photoActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  savePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SAFELI_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  savePhotoButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelPhotoButton: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 20,
  },
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
  changePasswordOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#DCE9F7',
    marginTop: 4,
  },
  changePasswordLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  changePasswordText: { fontSize: 14, fontWeight: '700', color: SAFELI_BLUE },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 16 },
  buttonsContainer: { paddingHorizontal: 60, gap: 14, alignItems: 'center', marginBottom: 16 },
  pillButton: { width: '100%', maxWidth: 260, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#1A3FA8', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  pillButtonText: { color: '#1A3FA8', fontSize: 16, fontWeight: '600' },
});