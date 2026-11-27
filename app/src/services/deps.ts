import type { SqlDatabase } from '@/database/types';

/**
 * Dependencias que reciben los servicios (inyección de dependencias).
 *
 * Por qué: los servicios no importan Expo directamente. En el teléfono reciben
 * expo-crypto, SecureStore y el reloj del sistema (`platformDeps.ts`); en las
 * pruebas, versiones de Node con reloj fijo (`testing/createTestDeps.ts`).
 * Así cada caso de uso se prueba contra SQLite real sin teléfono.
 */

export interface CryptoProvider {
  /** UUID v4 (R-05). */
  randomUUID(): string;
  /** `byteCount` bytes aleatorios en hexadecimal. */
  randomHex(byteCount: number): string;
  /** SHA-256 en hexadecimal del texto en UTF-8. */
  sha256Hex(input: string): Promise<string>;
}

/** Sesión de la Entrega 1: solo el id del usuario activo (P-57). */
export interface SessionStorage {
  getActiveUserId(): Promise<string | null>;
  setActiveUserId(userId: string): Promise<void>;
  clearActiveUserId(): Promise<void>;
}

/** Reloj inyectado (CLAUDE.md §9.5). */
export type Clock = () => Date;

export interface AppDeps {
  db: SqlDatabase;
  crypto: CryptoProvider;
  session: SessionStorage;
  now: Clock;
}
