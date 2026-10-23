import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedPhoto = { uri: string; mimeType?: string; fileName?: string };

export async function pickOrbitPhoto(): Promise<PickedPhoto | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error('Necesitamos permiso para acceder a tus fotos.');
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, mimeType: a.mimeType, fileName: a.fileName ?? undefined };
}

export async function appendPhoto(form: FormData, photo: PickedPhoto, field = 'foto') {
  const type = photo.mimeType ?? 'image/jpeg';
  const name = photo.fileName ?? `orbit.${type.split('/')[1] ?? 'jpg'}`;
  if (Platform.OS === 'web') {
    const blob = await (await fetch(photo.uri)).blob();
    form.append(field, blob, name);
  } else {
    form.append(field, { uri: photo.uri, name, type } as any);
  }
}