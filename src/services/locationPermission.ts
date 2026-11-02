import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Preferencia del usuario: ¿Safeli puede usar tu ubicación? (por defecto sí)
// (SecureStore solo admite letras, números, ".", "-" y "_" en la clave)
const KEY = 'safeli_location_enabled';

const storage = {
  get: async (): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(KEY);
    return SecureStore.getItemAsync(KEY);
  },
  set: async (value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  },
};

let current = true;
let loaded = false;
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<(value: boolean) => void>();

function emit() {
  listeners.forEach((l) => l(current));
}

function load(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (!loadingPromise) {
    loadingPromise = storage
      .get()
      .then((raw) => {
        if (raw !== null) current = raw === 'true';
      })
      .catch(() => {})
      .finally(() => {
        loaded = true;
        emit();
      });
  }
  return loadingPromise;
}

/** Para código que no es un componente (servicios, tareas en segundo plano). */
export async function isLocationEnabled(): Promise<boolean> {
  await load();
  return current;
}

/**
 * Guarda la preferencia. Al activarla pide además el permiso del sistema;
 * si el sistema lo deniega, la preferencia queda desactivada y devuelve false.
 */
export async function setLocationEnabled(value: boolean): Promise<boolean> {
  await load();
  let next = value;
  if (value) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') next = false;
    } catch {
      next = false;
    }
  }
  current = next;
  try {
    await storage.set(String(next));
  } catch {}
  emit();
  return next === value;
}

/** Hook reactivo: se actualiza en todas las pantallas cuando cambia el permiso. */
export function useLocationPermission() {
  const [enabled, setEnabled] = useState(current);
  const [ready, setReady] = useState(loaded);

  useEffect(() => {
    let mounted = true;
    const listener = (v: boolean) => {
      if (!mounted) return;
      setEnabled(v);
      setReady(true);
    };
    listeners.add(listener);
    load().then(() => {
      if (mounted) {
        setEnabled(current);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { locationEnabled: enabled, ready };
}