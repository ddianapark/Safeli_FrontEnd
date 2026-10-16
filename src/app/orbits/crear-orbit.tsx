// @ts-nocheck
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';

type Member = { 
    id: string; 
    name: string; 
    role?: string };

type Orbit = { 
    id: string; 
    name: string; 
    members: Member[] } | null;

    
const SAFELI_BLUE = '#1A3FA8';

export default function CrearOrbitScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Nombre vacío', 'Ingresá un nombre para el Orbit.');
    setLoading(true);
    try {
      const res = await api.orbits.create({ name: name.trim() });
      // redirect a orbit-inside view con id creado (ruta dentro de folder `orbits`)
      router.push(`/orbits/orbit-inside?id=${encodeURIComponent(res.id)}`);
    } catch (err: any) {
      console.error('Error creando orbit:', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'No se pudo crear el Orbit.';
      Alert.alert('Error', String(serverMessage));
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerStrip} />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Image source={require('../../../assets/images/logotipo_color.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Crear Orbit</Text>

        <View style={styles.body}>
          <TextInput
            placeholder="Nombre de Orbit"
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity style={styles.addMemberRow} onPress={() => Alert.alert('Agregar miembro', 'Función de agregar miembro aún no implementada')}>
            <View style={styles.addMemberButton}>
              <Text style={styles.addMemberText}>Agregar miembro</Text>
            </View>
            <View style={styles.plusCircle}><Text style={styles.plus}>+</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.createMainButton, !name.trim() && styles.buttonDisabled]} onPress={handleCreate} disabled={!name.trim() || loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createMainButtonText}>Crear</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerStrip: { height: 12, backgroundColor: SAFELI_BLUE },
  content: { flex: 1, alignItems: 'center', paddingTop: 18, backgroundColor: '#ffffff' },
  logo: { width: 140, height: 64, marginTop: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: SAFELI_BLUE, marginBottom: 18 },
  backButton: { position: 'absolute', left: 14, top: 18, padding: 8 },
  backIcon: { color: SAFELI_BLUE, fontSize: 20 },
  body: { width: '100%', flex: 1, padding: 18, alignItems: 'center' },
  input: { width: '60%', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: SAFELI_BLUE, marginBottom: 18, textAlign: 'center' },
  addMemberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  addMemberButton: { backgroundColor: '#EAF4F9', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 10 },
  addMemberText: { color: SAFELI_BLUE },
  plusCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: SAFELI_BLUE },
  plus: { color: SAFELI_BLUE, fontSize: 18, fontWeight: '700' },
  createMainButton: { backgroundColor: SAFELI_BLUE, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, alignItems: 'center' },
  createMainButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.6 },
});
