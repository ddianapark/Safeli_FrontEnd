import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { getErrorMessage, notify } from '../../services/Orbitinvite';
import { pickOrbitPhoto, type PickedPhoto } from '../../services/orbitPhoto';

const SAFELI_BLUE = '#1A3FA8';

export default function CrearOrbitScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  // Si ya se creó el Orbit (por ej. al tocar "Agregar miembro"), reutilizamos el id para no duplicarlo
  const [createdId, setCreatedId] = useState<string | null>(null);

  const ensureOrbit = async (): Promise<string | null> => {
    if (createdId) return createdId;
    if (!name.trim()) {
      notify('Nombre vacío', 'Ingresá un nombre para el Orbit.');
      return null;
    }

    setLoading(true);
    try {
      const res: any = await api.orbits.create(name.trim(), photo ?? undefined);
      const id = res?.id ?? res?.orbit?.id;
      if (!id) throw new Error('El servidor no devolvió el id del Orbit.');
      setCreatedId(String(id));
      return String(id);
    } catch (err: any) {
      console.error('Error creando orbit:', err);
      notify('Error', getErrorMessage(err, 'No se pudo crear el Orbit.'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const id = await ensureOrbit();
    if (!id) return;
    router.replace({ pathname: '/orbits/orbit-inside', params: { id } });
  };

  const handleAddMember = async () => {
    const id = await ensureOrbit();
    if (!id) return;
    router.push({ pathname: '/orbits/agregar-miembro', params: { orbitId: id } });
  };

  const handlePickPhoto = async () => {
    try {
      const picked = await pickOrbitPhoto();
      if (!picked) return;
      setPhoto(picked);
      // Si el Orbit ya existe, la foto se sube directo
      if (createdId) {
        setLoading(true);
        await api.orbits.updatePhoto(createdId, picked);
      }
    } catch (err: any) {
      notify('Error', getErrorMessage(err, 'No se pudo cambiar la foto.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Image source={require('../../../assets/images/logotipo_color.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Crear Orbit</Text>

        <View style={styles.body}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={loading} activeOpacity={0.8} style={styles.photoPicker}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photoImg} />
            ) : (
              <View style={[styles.photoImg, styles.photoEmpty]}>
                <Text style={styles.photoPlus}>📷</Text>
              </View>
            )}
            <Text style={styles.photoHint}>{photo ? 'Cambiar foto' : 'Agregar foto (opcional)'}</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Nombre de Orbit"
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={name}
            onChangeText={setName}
            editable={!createdId && !loading}
          />

          <TouchableOpacity style={styles.addMemberRow} onPress={handleAddMember} disabled={loading}>
            <View style={styles.addMemberButton}>
              <Text style={styles.addMemberText}>Agregar miembro</Text>
            </View>
            <View style={styles.plusCircle}>
              <Text style={styles.plus}>+</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createMainButton, (!name.trim() || loading) && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createMainButtonText}>Crear</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, alignItems: 'center', paddingTop: 18, backgroundColor: '#ffffff' },
  logo: { width: 140, height: 64, marginTop: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: SAFELI_BLUE, marginBottom: 18 },
  backButton: { position: 'absolute', left: 14, top: 18, padding: 8 },
  backIcon: { color: SAFELI_BLUE, fontSize: 20 },
  body: { width: '100%', flex: 1, padding: 18, alignItems: 'center' },
  photoPicker: { alignItems: 'center', marginBottom: 18 },
  photoImg: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#DCE6FA' },
  photoEmpty: { justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: SAFELI_BLUE, borderStyle: 'dashed' },
  photoPlus: { fontSize: 28 },
  photoHint: { marginTop: 8, color: SAFELI_BLUE, fontSize: 13 },
  input: { width: '60%', minWidth: 200, backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: SAFELI_BLUE, marginBottom: 18, textAlign: 'center' },
  addMemberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  addMemberButton: { backgroundColor: '#EAF4F9', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 10 },
  addMemberText: { color: SAFELI_BLUE },
  plusCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: SAFELI_BLUE },
  plus: { color: SAFELI_BLUE, fontSize: 18, fontWeight: '700' },
  createMainButton: { backgroundColor: SAFELI_BLUE, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, alignItems: 'center' },
  createMainButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.6 },
});