/// <reference types="node" />
/**
 * SOLO PARA PRUEBAS (Jest en Node). La app nunca importa este archivo.
 * Dependencias de los servicios con node:crypto, sesión en memoria y reloj fijo.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { migrateDbIfNeeded } from '@/database/migrate';
import { createTestDatabase } from '@/database/testing/createTestDatabase';

import type { AppDeps, SessionStorage } from '../deps';

export interface MemorySession extends SessionStorage {
  current: string | null;
}

export function createMemorySession(): MemorySession {
  const session: MemorySession = {
    current: null,
    async getActiveUserId() {
      return session.current;
    },
    async setActiveUserId(userId) {
      session.current = userId;
    },
    async clearActiveUserId() {
      session.current = null;
    },
  };
  return session;
}

export const TEST_NOW = new Date('2026-11-27T15:00:00.000Z');

export interface TestClock {
  current: Date;
  set(date: Date): void;
  advanceSeconds(seconds: number): void;
}

/** Base de datos en memoria ya migrada + dependencias de prueba con reloj controlable. */
export async function createTestDeps(): Promise<AppDeps & { session: MemorySession; clock: TestClock }> {
  const db = createTestDatabase();
  await migrateDbIfNeeded(db);
  const clock: TestClock = {
    current: TEST_NOW,
    set(date) {
      clock.current = date;
    },
    advanceSeconds(seconds) {
      clock.current = new Date(clock.current.getTime() + seconds * 1000);
    },
  };
  return {
    clock,
    db,
    crypto: {
      randomUUID: () => randomUUID(),
      randomHex: (byteCount) => randomBytes(byteCount).toString('hex'),
      sha256Hex: async (input) => createHash('sha256').update(input, 'utf8').digest('hex'),
    },
    session: createMemorySession(),
    now: () => clock.current,
  };
}
