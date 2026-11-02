import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SAFELI_BLUE = '#1F2B99';

export default function IdiomaScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Cerrar" hitSlop={10}>
          <Ionicons name="close-circle-outline" size={36} color={SAFELI_BLUE} />
        </TouchableOpacity>
      </View>

      <Image source={require('../../../assets/images/logotipo_color.png')} style={styles.logo} resizeMode="contain" />

      <Text style={styles.title}>Idiomas:</Text>

      {/* Solo informativo: no se puede tocar ni cambiar */}
      <View style={styles.row} pointerEvents="none">
        <View style={styles.checkbox}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </View>
        <Text style={styles.rowText}>Español</Text>
      </View>

      <Text style={styles.note}>En este momento no hay otros idiomas disponibles.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { width: '100%', paddingHorizontal: 20, paddingTop: 16 },
  logo: { width: 200, height: 90, marginTop: 4, alignContent: 'center', alignSelf: 'center' },
  title: { fontSize: 22, color: SAFELI_BLUE, textAlign: 'center', marginTop: 8, marginBottom: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFFCFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 16,
    marginHorizontal: 30,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: SAFELI_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { fontSize: 16, color: '#111827' },
  note: { marginTop: 26, paddingHorizontal: 34, fontSize: 15, color: SAFELI_BLUE, textAlign: 'center', lineHeight: 22 },
});