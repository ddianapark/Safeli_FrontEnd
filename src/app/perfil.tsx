import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useAuth } from '../context/authContext';
import { Ionicons } from '@expo/vector-icons'; 

const SAFELI_BLUE = '#1F2B99';
const INPUT_BG = '#F0F7FF'; 

export default function ProfileScreen(
    { Username, Email, PhoneNumber, Bio, Pfp }:
    { Username?: string; Email?: string; PhoneNumber?: string; Bio?: string; Pfp?: string }
) {
  const { logout } = useAuth();

  const handlePlaceholderPress = (nombreBoton: string) => {
    const mensaje = `La sección de "${nombreBoton}" estará disponible próximamente.`;

    if (Platform.OS === 'web') {
        // Fallback para navegadores web
        alert(`Módulo en Desarrollo\n\n${mensaje}`);
    } else {
        // Alerta nativa para iOS y Android
        Alert.alert("Módulo en Desarrollo", mensaje);
    }
    };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBlueHeader} />

      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/logotipo_color.png')} style={styles.logo} />
      </View>

      <TouchableOpacity 
        style={styles.settingsGear} 
        onPress={() => handlePlaceholderPress('Configuración Avanzada')}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={32} color={SAFELI_BLUE} />
      </TouchableOpacity>

      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Image source={Pfp ? { uri: Pfp } : require('../../assets/images/default.jpg')} style={styles.avatarCircle} />
        </View>
      </View>

      <View style={styles.usernameRow}>
        <Text style={styles.usernameText}>{Username}</Text>
        <TouchableOpacity activeOpacity={0.6}>
          <Ionicons name="pencil" size={16} color="#000" style={styles.pencilIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldsContainer}>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder={Email || "Agregá tu email"} placeholderTextColor="#7A8B9E" editable={false} />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder={PhoneNumber || "Agregá tu número de teléfono"} placeholderTextColor="#7A8B9E" editable={false} />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder= {Bio || "Agregá una biografía"} placeholderTextColor="#7A8B9E" editable={false} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ajustes</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.pillButton} 
          onPress={() => handlePlaceholderPress('Destinos')}
          activeOpacity={0.7}
        >
          <Text style={styles.pillButtonText}>Destinos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.pillButton} 
          onPress={() => handlePlaceholderPress('Orbit')}
          activeOpacity={0.7}
        >
          <Text style={styles.pillButtonText}>Orbit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.pillButton} 
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={styles.pillButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 40, 
  },
  topBlueHeader: {
    height: Platform.OS === 'web' ? 40 : 50,
    backgroundColor: '#1A3FA8',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 5,
  },
  logo: {
    width: 200,          // Ancho controlado para que no rompa el layout
    height: 60,          // Alto estandarizado basado en la tipografía original
    resizeMode: 'contain', // Clave: evita que se pixele o estire feo
  },
  settingsGear: {
    alignSelf: 'flex-start',
    marginLeft: 28,
    marginTop: 5,
    marginBottom: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  avatarCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: '#1A3FA8',
    backgroundColor: '#E0E6ED', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 25,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pencilIcon: {
    marginTop: 2,
  },
  fieldsContainer: {
    paddingHorizontal: 40,
    gap: 14,
    marginBottom: 35,
  },
  inputWrapper: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    paddingHorizontal: 60,
    gap: 14,
    alignItems: 'center',
  },
  pillButton: {
    width: '100%',
    maxWidth: 260,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1A3FA8',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pillButtonText: {
    color: '#1A3FA8',
    fontSize: 16,
    fontWeight: '600',
  },
});