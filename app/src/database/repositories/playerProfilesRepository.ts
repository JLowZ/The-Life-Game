import type { PlayerProfile } from '@/domain/types';

import type { SqlDatabase } from '../types';

interface ProfileRow {
  user_id: unknown;
  level: unknown;
  xp_total: unknown;
  mate_leaves_balance: unknown;
  hp_half_units: unknown;
  perfect_streak: unknown;
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function toPlayerProfile(row: ProfileRow): PlayerProfile {
  if (
    typeof row.user_id !== 'string' ||
    !isInteger(row.level) ||
    !isInteger(row.xp_total) ||
    !isInteger(row.mate_leaves_balance) ||
    !isInteger(row.hp_half_units) ||
    !isInteger(row.perfect_streak)
  ) {
    throw new Error('Perfil de jugador inválido en la base de datos.');
  }
  return {
    userId: row.user_id,
    level: row.level,
    xpTotal: row.xp_total,
    mateLeavesBalance: row.mate_leaves_balance,
    hpHalfUnits: row.hp_half_units,
    perfectStreak: row.perfect_streak,
  };
}

/** Los valores iniciales los decide el servicio desde la configuración (DATA_MODEL.md §3.1). */
export async function insertPlayerProfile(
  db: SqlDatabase,
  profile: PlayerProfile & { now: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO player_profiles (user_id, level, xp_total, mate_leaves_balance, hp_half_units,
       perfect_streak, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.userId,
      profile.level,
      profile.xpTotal,
      profile.mateLeavesBalance,
      profile.hpHalfUnits,
      profile.perfectStreak,
      profile.now,
    ],
  );
}

/** Actualiza la caché de saldos (R-06) tras insertar sus movimientos en la misma transacción. */
export async function updatePlayerBalances(
  db: SqlDatabase,
  params: { userId: string; mateLeavesBalance: number; xpTotal: number; level: number; now: string },
): Promise<void> {
  await db.runAsync(
    `UPDATE player_profiles SET mate_leaves_balance = ?, xp_total = ?, level = ?, updated_at = ?,
       version = version + 1
     WHERE user_id = ?`,
    [params.mateLeavesBalance, params.xpTotal, params.level, params.now, params.userId],
  );
}

export async function getPlayerProfile(db: SqlDatabase, userId: string): Promise<PlayerProfile | null> {
  const row = await db.getFirstAsync<ProfileRow>(
    `SELECT user_id, level, xp_total, mate_leaves_balance, hp_half_units, perfect_streak
       FROM player_profiles WHERE user_id = ?`,
    [userId],
  );
  return row ? toPlayerProfile(row) : null;
}
