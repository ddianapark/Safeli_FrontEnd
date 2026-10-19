import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { getErrorMessage, joinWithInvite, notify, parseInviteCode } from '../../services/Orbitinvite';

const SAFELI_BLUE = '#1A3FA8';

type OrbitItem = { id: string; name: string; memberCount?: number };

export default function OrbitsScreen() {
  const router = useRouter();
  const [orbits, setOrbits] = useState<OrbitItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [inviteText, setInviteText] = useState('');
  const [joining, setJoining] = useState(false);

  // Recarga la lista cada vez que se vuelve a esta pantalla (después de crear o unirse)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await api.orbits.listMine();
          const list = (res?.orbits ?? []).map((o: any) => ({
            id: String(o.id),
            name: String(o.name),
            memberCount: o.memberCount ?? o.members_count ?? (Array.isArray(o.members) ? o.members.length : undefined),
          }));
          if (!cancelled) setOrbits(list);
        } catch (e: any) {
          if (!cancelled) notify('Error', getErrorMessage(e, 'No se pudieron cargar tus Orbits.'));
        } finally {
          if (!cancelled) setLoadingList(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleJoin = async () => {
    const code = parseInviteCode(inviteText);
    if (!code) {
      notify('Enlace inválido', 'Pegá el enlace de invitación del Orbit.');
      return;
    }

    setJoining(true);
    try {
      const orbitId = await joinWithInvite(code);
      setInviteText('');
      router.push({ pathname: '/orbits/orbit-inside', params: { id: orbitId } });
    } catch (e: any) {
      notify('Error al unirte', getErrorMessage(e, 'No se pudo unir al Orbit.'));
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={require('../../../assets/images/logotipo_color.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Tus Orbits</Text>

        {loadingList ? (
          <ActivityIndicator color={SAFELI_BLUE} style={{ marginVertical: 24 }} />
        ) : orbits.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardText}>No tenés Orbits aún, unite a uno o crealo.</Text>
          </View>
        ) : (
          orbits.map((o) => (
            <TouchableOpacity
              key={o.id}
              style={styles.orbitCard}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/orbits/orbit-inside', params: { id: o.id } })}
            >
              <View style={styles.orbitAvatar}>
                <Text style={styles.orbitAvatarText}>{o.name.trim().charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.orbitName}>{o.name}</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.buttonsRow}>
          <TextInput
            value={inviteText}
            onChangeText={setInviteText}
            placeholder="Link para unirse a orbit"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.linkInput}
            onSubmitEditing={handleJoin}
          />

          <TouchableOpacity style={[styles.primaryButton, joining && styles.buttonDisabled]} onPress={handleJoin} disabled={joining}>
            {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Ingresar</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/orbits/crear-orbit')}>
          <Text style={styles.createButtonText}>Crear Orbit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { alignItems: 'center', paddingTop: 24, paddingBottom: 24 },
  logo: { width: 120, height: 64, marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '700', color: SAFELI_BLUE, marginBottom: 18 },
  card: { width: '86%', backgroundColor: '#F0FBFB', borderRadius: 12, padding: 18, alignItems: 'center' },
  cardText: { color: '#475569', textAlign: 'center' },
  orbitCard: { width: '86%', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  orbitAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#DCE6FA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  orbitAvatarText: { color: SAFELI_BLUE, fontWeight: '700', fontSize: 22 },
  orbitName: { color: '#0F172A', fontSize: 14 },
  buttonsRow: { width: '86%', flexDirection: 'row', gap: 10, marginTop: 24, alignItems: 'center' },
  linkInput: { flex: 1, borderWidth: 1, borderColor: SAFELI_BLUE, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', color: '#0F172A' },
  primaryButton: { backgroundColor: SAFELI_BLUE, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  createButton: { marginTop: 18, backgroundColor: SAFELI_BLUE, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 12 },
  createButtonText: { color: '#fff', fontWeight: '700' },
});