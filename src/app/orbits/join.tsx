import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getErrorMessage, joinWithInvite, notify, parseInviteCode } from '../../services/Orbitinvite';

export default function JoinOrbitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; url?: string }>();
  const [inviteText, setInviteText] = useState('');
  const [loading, setLoading] = useState(false);
  const autoJoinedFor = useRef<string | null>(null);

  const handleJoin = async (rawCode?: string) => {
    const code = rawCode ?? parseInviteCode(inviteText);
    if (!code) {
      notify('Enlace inválido', 'Pegá el enlace o el código de invitación del Orbit.');
      return;
    }

    setLoading(true);
    try {
      const orbitId = await joinWithInvite(code);
      router.replace({ pathname: '/orbits/orbit-inside', params: { id: orbitId } });
    } catch (error: any) {
      notify('Error al unirte', getErrorMessage(error, 'No se pudo unir al Orbit.'));
    } finally {
      setLoading(false);
    }
  };

  // Si se abrió desde un enlace (safeli://orbits/join?code=XXXX), se une automáticamente una sola vez
  useEffect(() => {
    const code =
      (typeof params.code === 'string' && params.code) ||
      parseInviteCode(typeof params.url === 'string' ? params.url : undefined);

    if (!code || autoJoinedFor.current === code) return;
    autoJoinedFor.current = code;
    setInviteText(code);
    void handleJoin(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code, params.url]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Unirse a un Orbit</Text>

        <TextInput
          value={inviteText}
          onChangeText={setInviteText}
          placeholder="Pegá el enlace del Orbit"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <TouchableOpacity style={styles.joinButton} onPress={() => handleJoin()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinButtonText}>Unirme al Orbit</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A3FA8', marginBottom: 16 },
  input: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 18,
  },
  joinButton: { width: '100%', maxWidth: 360, backgroundColor: '#1A3FA8', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});