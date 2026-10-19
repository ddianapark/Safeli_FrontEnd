import { Alert, Platform } from 'react-native';
import { api } from './api';

/**
 * Arma el enlace de invitación a partir del código único del Orbit.
 * - Web: usa el origen actual (no hay dominio propio todavía).
 * - Nativo: usa el scheme "safeli://" definido en app.json.
 */
export function buildInviteUrl(code: string): string {
  const path = `orbits/join?code=${encodeURIComponent(code)}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/${path}`;
  }
  return `safeli://${path}`;
}

/**
 * Extrae el código desde un enlace completo (?code=XXXX) o desde el código pegado a secas.
 * Devuelve undefined si no se reconoce nada válido.
 */
export function parseInviteCode(value?: string | null): string | undefined {
  const text = (value ?? '').trim();
  if (!text) return undefined;

  const match = /[?&](?:code|invite)=([^&#\s]+)/i.exec(text);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  // Código pegado solo (sin URL)
  if (/^[A-Za-z0-9_-]{4,64}$/.test(text)) return text;

  return undefined;
}

/** Une al usuario logueado al Orbit dueño del código. Devuelve el id del Orbit. */
export async function joinWithInvite(code: string): Promise<string> {
  const res: any = await api.orbits.join({ code });
  const orbitId = res?.orbitId ?? res?.orbit_id ?? res?.id ?? res?.orbit?.id;
  if (!orbitId) throw new Error('No se pudo determinar el Orbit al que te uniste.');
  return String(orbitId);
}

export function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  const fromServer = typeof data === 'string' ? data : data?.message ?? data?.error;
  return String(fromServer || error?.message || fallback);
}

/**
 * Copia texto al portapapeles sin importar expo-clipboard al cargar el módulo
 * (en web usa la API del navegador; en nativo carga expo-clipboard recién al usarse).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // cae al método alternativo
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Clipboard = require('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

/** Alert.alert no hace nada en react-native-web, así que en web usamos window.alert. */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}