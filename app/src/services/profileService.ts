import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import { findUserPurpose } from '@/database/repositories/usersRepository';
import type { SqlDatabase } from '@/database/types';
import type { PlayerProfile } from '@/domain/types';
import { usePlayerStore } from '@/state/usePlayerStore';

/** Estado de juego del usuario activo. */
export async function loadPlayerProfile(db: SqlDatabase, userId: string): Promise<PlayerProfile> {
  const profile = await getPlayerProfile(db, userId);
  if (!profile) throw new Error('El usuario no tiene perfil de jugador.');
  return profile;
}

/**
 * Recarga el HUD desde SQLite (RN-NAV-03). Las fases siguientes la llaman al
 * terminar cada acción que cambie Hojas, XP, HP o racha.
 */
export async function refreshPlayerProfile(db: SqlDatabase, userId: string): Promise<void> {
  usePlayerStore.getState().setProfile(await loadPlayerProfile(db, userId));
}

/** Al cerrar sesión, el HUD no debe mostrar datos de la cuenta anterior. */
export function clearPlayerProfile(): void {
  usePlayerStore.getState().setProfile(null);
}

/** Propósito del usuario para los mensajes de cierre (P-34). */
export async function loadPurpose(db: SqlDatabase, userId: string): Promise<string | null> {
  return findUserPurpose(db, userId);
}
