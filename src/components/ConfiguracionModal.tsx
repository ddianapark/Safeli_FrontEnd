import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export type ConfigItemId = 'permisos' | 'idioma' | 'orbit' | 'ayuda' | 'terminos' | 'logout';

const ITEMS: { id: ConfigItemId; label: string }[] = [
  { id: 'permisos', label: 'Permisos' },
  { id: 'idioma', label: 'Idioma' },
  { id: 'orbit', label: 'Orbits' },
  { id: 'ayuda', label: 'Ayuda' },
  { id: 'terminos', label: 'Términos y Condiciones' },
  { id: 'logout', label: 'Cerrar sesión' },
];

const ANIM_MS = 250;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Se llama al tocar "Cerrar sesión" (ej. signOut de useAuth). El modal se cierra solo. */
  onSignOut: () => void | Promise<void>;
  /** Se llama al tocar cualquier otra opción, para navegar a su pantalla. El modal se cierra solo. */
  onItemPress?: (id: Exclude<ConfigItemId, 'logout'>) => void;
}

export default function ConfiguracionModal({ visible, onClose, onSignOut, onItemPress }: Props) {
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.78, 360);

  // 'mounted' mantiene el Modal en pantalla mientras corre la animación de salida
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: ANIM_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: ANIM_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  const handlePress = async (id: ConfigItemId) => {
    onClose();
    if (id === 'logout') {
      await onSignOut();
      return;
    }
    onItemPress?.(id);
  };

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Fondo oscuro con fade; tocar afuera cierra */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Panel que se desliza desde la izquierda */}
        <Animated.View style={[styles.panel, { width: panelWidth, transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Configuración</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar configuración" hitSlop={10}>
              <MaterialCommunityIcons name="close-circle-outline" size={32} color="#1D2DA4" />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {ITEMS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handlePress(item.id)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Text style={styles.rowText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderRightWidth: 1,
    borderRightColor: '#1D2DA4',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: '#F3F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2DA4',
  },
  screenTitle: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    borderTopWidth: 0,
  },
  row: {
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2DA4',
  },
  rowPressed: { backgroundColor: '#F0F3FF' },
  rowText: { fontSize: 15, color: '#111827' },
});