import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';

type Member = { id: string; name: string; role?: string };
type Orbit = { id: string; name: string; members: Member[] } | null;

export default function OrbitInsideScreen() {
  const { id } = useSearchParams();
  const router = useRouter();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orbit: {orbit?.name ?? '—'}</Text>
      </View>

      <View style={styles.body}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FF' },
  header: {
    backgroundColor: '#1A3FA8',
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 56,
    padding: 8,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', paddingHorizontal: 40 },
  body: { flex: 1, padding: 20 },
  card: { marginTop: 8, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E6EEF9' },
  cardText: { fontWeight: '700', marginBottom: 8, color: '#0F172A' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  memberName: { fontWeight: '600' },
  memberRole: { color: '#64748B', fontSize: 12 },
});
