import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/authContext';

const SOS_RED = '#BC0000';

const SERVICIOS = [
  { label: 'Policía', numero: '101' },
  { label: 'Ambulancia', numero: '107' },
  { label: 'Bomberos', numero: '100' },
];

export default function SosScreen() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // -1 (o vacío) = el usuario no cargó contacto de emergencia
  const contactoEmergencia =
    user?.contactoEmergencia && user.contactoEmergencia !== -1 ? user.contactoEmergencia : null;

  const llamar = async (numero: string | number) => {
    setError(null);
    const url = `tel:${numero}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn('No se pudo iniciar la llamada', e);
      setError(`No se pudo iniciar la llamada. Marcá ${numero} manualmente.`);
    }
  };

  const cancelar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/safeli.png')} style={styles.logo} resizeMode="contain" />

      <View style={styles.buttons}>
        {contactoEmergencia ? (
          <TouchableOpacity style={styles.sosButton} onPress={() => llamar(contactoEmergencia)} activeOpacity={0.8}>
            <Text style={styles.sosButtonText}>Llamar a contacto</Text>
          </TouchableOpacity>
        ) : null}

        {SERVICIOS.map((s) => (
          <TouchableOpacity key={s.numero} style={styles.sosButton} onPress={() => llamar(s.numero)} activeOpacity={0.8}>
            <Text style={styles.sosButtonText}>{s.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.cancelButton} onPress={cancelar} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  logo: {
    width: 120,
    height: 60,
  },
  buttons: {
    flex: 1,
    width: '100%',
    maxWidth: 260,
    justifyContent: 'center',
    gap: 18,
  },
  sosButton: {
    backgroundColor: SOS_RED,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignSelf: 'center',
    width: '75%',
    borderWidth: 1,
    borderColor: SOS_RED,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: SOS_RED,
    fontSize: 15,
  },
  errorText: {
    color: SOS_RED,
    textAlign: 'center',
    fontSize: 13,
  },
});
