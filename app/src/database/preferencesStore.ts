import Storage from 'expo-sqlite/kv-store';

import { MUSIC_VOLUME_DEFAULT, MUSIC_VOLUME_MAX, MUSIC_VOLUME_MIN } from '@/config/audio';

/**
 * Preferencias del dispositivo (R-03): clave-valor de expo-sqlite, separado de
 * los datos del juego. No son datos de juego ni se respaldan.
 */
const MUSIC_VOLUME_KEY = 'musicVolume';

export function clampMusicVolume(value: number): number {
  return Math.min(MUSIC_VOLUME_MAX, Math.max(MUSIC_VOLUME_MIN, Math.round(value)));
}

export async function getMusicVolume(): Promise<number> {
  const stored = await Storage.getItem(MUSIC_VOLUME_KEY);
  const parsed = stored === null ? NaN : Number(stored);
  return Number.isFinite(parsed) ? clampMusicVolume(parsed) : MUSIC_VOLUME_DEFAULT;
}

export async function setMusicVolume(value: number): Promise<number> {
  const volume = clampMusicVolume(value);
  await Storage.setItem(MUSIC_VOLUME_KEY, String(volume));
  return volume;
}
