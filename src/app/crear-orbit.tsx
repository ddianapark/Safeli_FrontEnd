// @ts-nocheck
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { router } from 'expo-router';

type Member = { 
    id: string; 
    name: string; 
    role?: string };

type Orbit = { 
    id: string; 
    name: string; 
    members: Member[] } | null;

export default function CrearOrbitScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Nombre vacío', 'Ingresá un nombre para el Orbit.');
    setLoading(true);
    try {
      const res = await api.orbits.create({ name: name.trim() });
      setLoading(false);
      // redirect a orbit-inside view con id creado
      router.push(`/orbit-inside?id=${encodeURIComponent(res.id)}`);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo crear el Orbit.');
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Orbit</Text>

      <TextInput
        placeholder="Nombre del Orbit"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={[styles.button, !name.trim() && styles.buttonDisabled]} onPress={handleCreate} disabled={!name.trim() || loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear Orbit</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E6EEF9', marginBottom: 12 },
  button: { backgroundColor: '#1A3FA8', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
