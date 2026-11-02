import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setLocationEnabled, useLocationPermission } from '../../services/locationPermission';
import { notify } from '../../services/Orbitinvite';

const SAFELI_BLUE = '#1F2B99';

export default function PermisosScreen() {
  const router = useRouter();
  const { locationEnabled, ready } = useLocationPermission();
  const [checked, setChecked] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carga el valor guardado una sola vez
  useEffect(() => {
    if (ready) setChecked(locationEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleOk = async () => {
    setSaving(true);
    try {
      const ok = await setLocationEnabled(checked);
      if (!ok) {
        setChecked(false);
        notify('Ubicación', 'No se pudo activar la ubicación. Habilitá el permiso desde los ajustes del dispositivo.');
        return;
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Cerrar" hitSlop={10}>
            <Ionicons name="close-circle-outline" size={36} color={SAFELI_BLUE} />
        </TouchableOpacity>
      </View>

      <Image source={require('../../../assets/images/logotipo_color.png')} style={styles.logo} resizeMode="contain" />

      <Text style={styles.title}>Permite a Safeli:</Text>

      <Pressable style={styles.row} onPress={() => setChecked((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.rowText}>Acceder a tu ubicación</Text>
      </Pressable>

      <TouchableOpacity style={[styles.okButton, saving && { opacity: 0.6 }]} onPress={handleOk} disabled={saving} activeOpacity={0.8}>
        <Text style={styles.okText}>OK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  topBar: { width: '100%', paddingHorizontal: 20, paddingTop: 16 },
  logo: { width: 200, height: 90, marginTop: 4 },
  title: { fontSize: 20, color: '#111827', marginTop: 28, marginBottom: 26 },
  row: {
    width: '84%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFFCFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0000FF',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#0000FF' },
  rowText: { flex: 1, textAlign: 'center', fontSize: 14, color: '#111827', marginRight: 22 },
  okButton: {
    marginTop: 30,
    width: 136,
    height: 34,
    borderRadius: 17,
    backgroundColor: SAFELI_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});