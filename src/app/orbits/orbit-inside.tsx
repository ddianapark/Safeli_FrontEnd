import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { getErrorMessage, notify } from '../../services/Orbitinvite';
import { Ionicons } from '@expo/vector-icons';
import { pickOrbitPhoto } from '../../services/orbitPhoto';

const SAFELI_BLUE = '#1A3FA8';

type Member = { id: string; name: string; subtitle?: string; photo?: string };
type Orbit = { id: string; name: string; photo?: string; members: Member[] };

// Tolera distintas formas de miembro que pueda devolver el backend
function normalizeMember(m: any, index: number): Member {
  const fullName = [m?.firstName ?? m?.nombre, m?.lastName ?? m?.apellido].filter(Boolean).join(' ');
  const name = m?.isMe ? 'Tú' : m?.name ?? (fullName || m?.username) ?? 'Miembro';
  const photo = typeof m?.foto === 'string' && m.foto.startsWith('http') ? m.foto : undefined;
  return {
    id: String(m?.id ?? m?.userId ?? m?.user_id ?? index),
    name: String(name),
    subtitle: m?.address ?? m?.direccion,
    photo,
  };
}

export default function OrbitInsideScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const router = useRouter();
  const [orbit, setOrbit] = useState<Orbit | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Se recarga cada vez que la pantalla toma foco (ej. al volver de "Agregar usuario")
  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setLoading(false);
        return;
      }
      let cancelled = false;
      (async () => {
        try {
          const res: any = await api.orbits.get(id);
          if (!cancelled) {
            setOrbit({
              id: String(res.id),
              name: res.name,
              photo: res.photo ?? undefined,
              members: (res.members ?? []).map(normalizeMember),
            });
          }
        } catch (e: any) {
          if (!cancelled) notify('Error', getErrorMessage(e, 'No se pudo obtener el Orbit.'));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleChangePhoto = async () => {
    if (!orbit) return;
    try {
      const picked = await pickOrbitPhoto();
      if (!picked) return;
      setUploadingPhoto(true);
      const res = await api.orbits.updatePhoto(orbit.id, picked);
      setOrbit((o) => (o ? { ...o, photo: res.photo } : o));
    } catch (e: any) {
      notify('Error', getErrorMessage(e, 'No se pudo cambiar la foto.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={SAFELI_BLUE} />
      </View>
    );
  }

  const handlePlaceholderPress = (nombreBoton: string) => {
   setAlertMessage(`La sección de "${nombreBoton}" estará disponible próximamente.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <Image source={require('../../../assets/images/logotipo_color.png')} style={styles.logo} resizeMode="contain" />
      
      <TouchableOpacity onPress={handleChangePhoto} disabled={!orbit || uploadingPhoto} activeOpacity={0.8} style={styles.orbitPhotoWrap}>
        {orbit?.photo ? (
          <Image source={{ uri: orbit.photo }} style={styles.orbitPhoto} />
        ) : (
          <View style={[styles.orbitPhoto, styles.orbitPhotoEmpty]}>
            <Text style={styles.orbitPhotoLetter}>{(orbit?.name ?? '?').trim().charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.cameraBadge}>
          {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.settingsGear}
          onPress={() => handlePlaceholderPress('Configuración Avanzada')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={28} color={SAFELI_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {orbit?.name ?? '—'}
        </Text>
        <TouchableOpacity
          style={styles.plusCircle}
          disabled={!orbit}
          onPress={() => orbit && router.push({ pathname: '/orbits/agregar-miembro', params: { orbitId: orbit.id } })}
        >
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {(orbit?.members ?? []).map((m) => (
          <View key={m.id} style={styles.memberRow}>
            {m.photo ? <Image source={{ uri: m.photo }} style={styles.avatar} /> : <View style={styles.avatar} />}
            <Text style={styles.memberText}>
              {m.name}
              {m.subtitle ? ` - ${m.subtitle}` : ''}
            </Text>
          </View>
        ))}
      </ScrollView>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  centered: { justifyContent: 'center' },
  topBar: { width: '100%', paddingHorizontal: 14, paddingTop: 10 },
  iconButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: SAFELI_BLUE, fontSize: 20 },
  logo: { width: 140, height: 64, marginBottom: 12 },
  titleRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, marginBottom: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', color: SAFELI_BLUE },
  plusCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: SAFELI_BLUE },
  plus: { color: SAFELI_BLUE, fontSize: 20, fontWeight: '700', lineHeight: 18, marginTop: -4 },
  list: { paddingHorizontal: 28, paddingBottom: 24, width: '100%' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2E8F0', marginRight: 14 },
  memberText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000', textAlign: 'center', marginTop: 12, marginBottom: 8 },
  customAlertOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    elevation: 8,
  },
  customAlertTitle: { fontSize: 18, fontWeight: '700', color: '#1D2DA4', marginBottom: 10 },
  customAlertText: { fontSize: 15, color: '#4A5568', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  customAlertButton: { backgroundColor: '#1D2DA4', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center' },
  customAlertButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  settingsGear: { alignSelf: 'flex-start', marginLeft: 20, marginTop: 5, marginBottom: 6 },
  buttonsContainer: { paddingHorizontal: 60, gap: 14, alignItems: 'center', marginBottom: 16 },
  pillButton: { width: '100%', maxWidth: 260, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#1A3FA8', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  pillButtonText: { color: '#1A3FA8', fontSize: 16, fontWeight: '600' },
  orbitPhotoWrap: { marginBottom: 12 },
  orbitPhoto: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#DCE6FA' },
  orbitPhotoEmpty: { justifyContent: 'center', alignItems: 'center' },
  orbitPhotoLetter: { color: SAFELI_BLUE, fontWeight: '700', fontSize: 34 },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: SAFELI_BLUE, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
});