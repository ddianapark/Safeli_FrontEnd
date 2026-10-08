import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SAFELI_BLUE = '#1A3FA8';

export default function OrbitsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.headerBar} />

      <View style={styles.content}>
        <Image source={require('../../../assets/images/safeli.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Tus Orbits</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>No tenés Orbits aún, unite a uno o crealo.</Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/orbit-inside' as any)}>
            <Text style={styles.linkButtonText}>Link para unirse a orbit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/' as any) }>
            <Text style={styles.primaryButtonText}>Ingresar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/crear-orbit' as any)}>
          <Text style={styles.createButtonText}>Crear Orbit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerBar: { height: 20, backgroundColor: '#2B3AAA' },
  content: { flex: 1, alignItems: 'center', paddingTop: 24 },
  logo: { width: 120, height: 64, marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '700', color: SAFELI_BLUE, marginBottom: 18 },
  card: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#E6EEF9' },
  cardText: { color: '#475569', textAlign: 'center' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 18, alignItems: 'center' },
  linkButton: { borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fff' },
  linkButtonText: { color: '#475569' },
  primaryButton: { backgroundColor: SAFELI_BLUE, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  createButton: { marginTop: 14, backgroundColor: SAFELI_BLUE, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  createButtonText: { color: '#fff', fontWeight: '700' },
});
