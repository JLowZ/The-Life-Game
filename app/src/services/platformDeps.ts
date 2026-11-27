import * as Crypto from 'expo-crypto';

import { clearActiveUserId, getActiveUserId, setActiveUserId } from '@/database/secureSession';

import type { Clock, CryptoProvider, SessionStorage } from './deps';

/** Implementaciones reales para el teléfono (Expo Go, SDK 58). */

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const expoCryptoProvider: CryptoProvider = {
  randomUUID: () => Crypto.randomUUID(),
  randomHex: (byteCount) => bytesToHex(Crypto.getRandomBytes(byteCount)),
  sha256Hex: (input) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, {
      encoding: Crypto.CryptoEncoding.HEX,
    }),
};

export const secureSessionStorage: SessionStorage = {
  getActiveUserId,
  setActiveUserId,
  clearActiveUserId,
};

/** Único lugar de la app que lee la hora del sistema. */
export const systemClock: Clock = () => new Date();
