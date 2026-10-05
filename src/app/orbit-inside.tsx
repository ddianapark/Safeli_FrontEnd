import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { useSearchParams } from 'expo-router';
import { api } from '../services/api';

type Member = { id: string; name: string; role?: string };
type Orbit = { id: string; name: string; members: Member[] } | null;

export default function OrbitInsideScreen() {
  const { id } = useSearchParams();
  const [orbit, setOrbit] = useState<Orbit>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.orbits.get(String(id));
        setOrbit({ id: res.id, name: res.name, members: res.members ?? [] });
      } catch (e) {
        Alert.alert('Error', 'No se pudo obtener el Orbit.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <View style={styles.container}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orbit: {orbit?.name ?? '—'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>Miembros del Orbit</Text>
        {(orbit?.members ?? []).map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <View style={styles.avatar} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberRole}>{m.role}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#1A3FA8' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E6EEF9', marginBottom: 12 },
  button: { backgroundColor: '#1A3FA8', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  card: { marginTop: 8, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E6EEF9' },
  cardText: { fontWeight: '700', marginBottom: 8, color: '#0F172A' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  memberName: { fontWeight: '600' },
  memberRole: { color: '#64748B', fontSize: 12 },
});
