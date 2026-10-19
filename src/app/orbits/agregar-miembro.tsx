import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { buildInviteUrl, copyToClipboard, getErrorMessage, notify } from '../../services/Orbitinvite';
import { useRouter } from 'expo-router';

const SAFELI_BLUE = '#1A3FA8';

export default function AgregarMiembroScreen() {
  const params = useLocalSearchParams<{ orbitId?: string }>();
  const router = useRouter();
  const orbitId = typeof params.orbitId === 'string' ? params.orbitId : undefined;

  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // El código de invitación lo genera y guarda el backend; acá solo lo pedimos
  useEffect(() => {
    if (!orbitId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const orbit: any = await api.orbits.get(orbitId);
        const code = orbit?.inviteCode ?? orbit?.invite_code ?? orbit?.code;
        if (!code) throw new Error('El servidor no devolvió un código de invitación para este Orbit.');
        if (!cancelled) setInviteUrl(buildInviteUrl(String(code)));
      } catch (error: any) {
        if (!cancelled) notify('No se pudo generar el enlace', getErrorMessage(error, 'Intentá de nuevo.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orbitId]);

  const handleCopyLink = async () => {
    if (!orbitId) {
      notify('Sin Orbit', 'Primero creá o seleccioná un Orbit para invitar.');
      return;
    }
    if (!inviteUrl) {
      notify('Enlace no disponible', 'Todavía no se pudo obtener el enlace de este Orbit.');
      return;
    }

    const copied = await copyToClipboard(inviteUrl);
    if (copied) {
      notify('Enlace copiado', 'Se copió el enlace único del Orbit.');
    } else {
      notify('No se pudo copiar', 'Podés compartir este enlace manualmente: ' + inviteUrl);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Image source={require('../../../assets/images/logotipo_color.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Agregar usuario</Text>

        <TouchableOpacity
          style={[styles.primaryButton, (loading || !inviteUrl) && styles.buttonDisabled]}
          onPress={handleCopyLink}
          activeOpacity={0.9}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Copiar enlace de invitación</Text>}
        </TouchableOpacity>

        {!!inviteUrl && (
          <Text style={styles.urlPreview} numberOfLines={2} selectable>
            {inviteUrl}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D9D9D9' },
  logo: { width: 140, height: 64, marginTop: 8, marginBottom: 12 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: SAFELI_BLUE, marginBottom: 60 },
  primaryButton: {
    width: '100%',
    maxWidth: 310,
    backgroundColor: SAFELI_BLUE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  urlPreview: { marginTop: 16, textAlign: 'center', color: '#475569', fontSize: 12, maxWidth: 320 },
  backButton: { position: 'absolute', left: 14, top: 18, padding: 8 },
  backIcon: { color: SAFELI_BLUE, fontSize: 20 },
});