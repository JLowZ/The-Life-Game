import { isHabitCategoryId } from '@/domain/categories';
import type { GameDate, HabitCategoryId, MissionStatus, UserMission } from '@/domain/types';

import type { SqlDatabase } from '../types';

/** Misiones secundarias (tabla user_missions). */

interface MissionRow {
  id: unknown;
  user_id: unknown;
  game_date: unknown;
  category_id: unknown;
  description: unknown;
  target_quantity: unknown;
  unit: unknown;
  mate_leaves_reward: unknown;
  xp_reward: unknown;
  status: unknown;
}

function toMission(row: MissionRow): UserMission {
  if (
    typeof row.id !== 'string' ||
    typeof row.user_id !== 'string' ||
    typeof row.game_date !== 'string' ||
    !isHabitCategoryId(row.category_id) ||
    typeof row.description !== 'string' ||
    typeof row.target_quantity !== 'number' ||
    typeof row.unit !== 'string' ||
    typeof row.mate_leaves_reward !== 'number' ||
    typeof row.xp_reward !== 'number' ||
    (row.status !== 'ACCEPTED' && row.status !== 'COMPLETED' && row.status !== 'ABANDONED')
  ) {
    throw new Error('Misión inválida en la base de datos.');
  }
  return {
    id: row.id,
    userId: row.user_id,
    gameDate: row.game_date,
    categoryId: row.category_id,
    description: row.description,
    targetQuantity: row.target_quantity,
    unit: row.unit,
    mateLeavesReward: row.mate_leaves_reward,
    xpReward: row.xp_reward,
    status: row.status as MissionStatus,
  };
}

const COLUMNS =
  'id, user_id, game_date, category_id, description, target_quantity, unit, mate_leaves_reward, xp_reward, status';

export async function insertMission(
  db: SqlDatabase,
  mission: {
    id: string;
    userId: string;
    gameDate: GameDate;
    categoryId: HabitCategoryId;
    description: string;
    targetQuantity: number;
    unit: string;
    mateLeavesReward: number;
    xpReward: number;
    now: string;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO user_missions (id, user_id, game_date, category_id, description, target_quantity, unit,
       mate_leaves_reward, xp_reward, status, accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACCEPTED', ?)`,
    [
      mission.id,
      mission.userId,
      mission.gameDate,
      mission.categoryId,
      mission.description,
      mission.targetQuantity,
      mission.unit,
      mission.mateLeavesReward,
      mission.xpReward,
      mission.now,
    ],
  );
}

export async function findMission(db: SqlDatabase, userId: string, id: string): Promise<UserMission | null> {
  const row = await db.getFirstAsync<MissionRow>(
    `SELECT ${COLUMNS} FROM user_missions WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return row ? toMission(row) : null;
}

export async function listMissionsForDate(db: SqlDatabase, userId: string, gameDate: GameDate): Promise<UserMission[]> {
  const rows = await db.getAllAsync<MissionRow>(
    `SELECT ${COLUMNS} FROM user_missions WHERE user_id = ? AND game_date = ? ORDER BY accepted_at`,
    [userId, gameDate],
  );
  return rows.map(toMission);
}

/** INT-20: las abandonadas no cuentan para el máximo diario (P-58). */
export async function countNonAbandonedMissions(db: SqlDatabase, userId: string, gameDate: GameDate): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) AS total FROM user_missions WHERE user_id = ? AND game_date = ? AND status <> 'ABANDONED'",
    [userId, gameDate],
  );
  return row?.total ?? 0;
}

/** ACCEPTED → COMPLETED / ABANDONED, solo si sigue aceptada (cerrojo optimista). */
export async function finishMission(
  db: SqlDatabase,
  params: { id: string; to: 'COMPLETED' | 'ABANDONED'; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE user_missions SET status = ?, completed_at = ? WHERE id = ? AND status = 'ACCEPTED'`,
    [params.to, params.to === 'COMPLETED' ? params.now : null, params.id],
  );
  return result.changes === 1;
}

/**
 * RN-MIS-06, P-58: las misiones aceptadas de jornadas ya terminadas pasan a
 * ABANDONED, sin coste. Se hace en la reconciliación (fecha < hoy), no en
 * Día Finalizado: así deshacer el cierre manual las deja intactas (INT-19).
 */
export async function abandonStaleMissions(db: SqlDatabase, userId: string, today: GameDate): Promise<number> {
  const result = await db.runAsync(
    "UPDATE user_missions SET status = 'ABANDONED' WHERE user_id = ? AND status = 'ACCEPTED' AND game_date < ?",
    [userId, today],
  );
  return result.changes;
}
