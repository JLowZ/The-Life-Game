import { isHabitCategoryId } from '@/domain/categories';
import type {
  DailyMission,
  GameDate,
  Habit,
  HabitOccurrence,
  OccurrenceStatus,
  ResolutionSource,
} from '@/domain/types';

import type { SqlDatabase } from '../types';

/** Ocurrencias: historial de cumplimiento con copia de valores (R-13). */

interface OccurrenceRow {
  id: unknown;
  user_id: unknown;
  habit_id: unknown;
  game_date: unknown;
  status: unknown;
  habit_name_snapshot: unknown;
  category_id_snapshot: unknown;
  target_quantity_snapshot: unknown;
  unit_snapshot: unknown;
  mate_leaves_reward_snapshot: unknown;
  xp_reward_snapshot: unknown;
  resolved_at: unknown;
  resolution_source: unknown;
  resolution_seq: unknown;
}

const STATUSES: readonly OccurrenceStatus[] = ['PENDING', 'COMPLETED', 'MISSED', 'CANCELLED', 'PAUSED'];

function isStatus(value: unknown): value is OccurrenceStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

function isSource(value: unknown): value is ResolutionSource | null {
  return value === null || value === 'USER' || value === 'DAY_CLOSE';
}

function toOccurrence(row: OccurrenceRow): HabitOccurrence {
  if (
    typeof row.id !== 'string' ||
    typeof row.user_id !== 'string' ||
    typeof row.habit_id !== 'string' ||
    typeof row.game_date !== 'string' ||
    !isStatus(row.status) ||
    typeof row.habit_name_snapshot !== 'string' ||
    !isHabitCategoryId(row.category_id_snapshot) ||
    typeof row.target_quantity_snapshot !== 'number' ||
    typeof row.unit_snapshot !== 'string' ||
    typeof row.mate_leaves_reward_snapshot !== 'number' ||
    typeof row.xp_reward_snapshot !== 'number' ||
    (row.resolved_at !== null && typeof row.resolved_at !== 'string') ||
    !isSource(row.resolution_source) ||
    typeof row.resolution_seq !== 'number'
  ) {
    throw new Error('Ocurrencia inválida en la base de datos.');
  }
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    gameDate: row.game_date,
    status: row.status,
    habitName: row.habit_name_snapshot,
    categoryId: row.category_id_snapshot,
    targetQuantity: row.target_quantity_snapshot,
    unit: row.unit_snapshot,
    mateLeavesReward: row.mate_leaves_reward_snapshot,
    xpReward: row.xp_reward_snapshot,
    resolvedAt: row.resolved_at,
    resolutionSource: row.resolution_source,
    resolutionSeq: row.resolution_seq,
  };
}

const COLUMNS = `id, user_id, habit_id, game_date, status, habit_name_snapshot, category_id_snapshot,
  target_quantity_snapshot, unit_snapshot, mate_leaves_reward_snapshot, xp_reward_snapshot,
  resolved_at, resolution_source, resolution_seq`;

/** Las mismas columnas con el alias `o.` para consultas con JOIN. */
const PREFIXED_COLUMNS = COLUMNS.split(',')
  .map((column) => `o.${column.trim()}`)
  .join(', ');

/**
 * Crea la ocurrencia del hábito en esa jornada copiando sus valores ACTUALES.
 * Si ya existe, no hace nada (UNIQUE(habit_id, game_date)): la de hoy conserva
 * sus valores aunque después se edite el hábito (RN-HAB-05). Idempotente.
 */
export async function insertOccurrenceIfAbsent(
  db: SqlDatabase,
  params: { id: string; habit: Habit; gameDate: GameDate; now: string },
): Promise<void> {
  const { habit } = params;
  await db.runAsync(
    `INSERT OR IGNORE INTO habit_occurrences (id, user_id, habit_id, game_date, status,
       habit_name_snapshot, category_id_snapshot, target_quantity_snapshot, unit_snapshot,
       mate_leaves_reward_snapshot, xp_reward_snapshot, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.id,
      habit.userId,
      habit.id,
      params.gameDate,
      habit.name,
      habit.categoryId,
      habit.targetQuantity,
      habit.unit,
      habit.mateLeavesReward,
      habit.xpReward,
      params.now,
      params.now,
    ],
  );
}

export async function findOccurrence(
  db: SqlDatabase,
  userId: string,
  id: string,
): Promise<HabitOccurrence | null> {
  const row = await db.getFirstAsync<OccurrenceRow>(
    `SELECT ${COLUMNS} FROM habit_occurrences WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return row ? toOccurrence(row) : null;
}

export async function listOccurrencesForDate(
  db: SqlDatabase,
  userId: string,
  gameDate: GameDate,
): Promise<HabitOccurrence[]> {
  const rows = await db.getAllAsync<OccurrenceRow>(
    `SELECT ${COLUMNS} FROM habit_occurrences WHERE user_id = ? AND game_date = ? ORDER BY created_at, id`,
    [userId, gameDate],
  );
  return rows.map(toOccurrence);
}

/** Misiones del día: ocurrencias de la jornada con el aviso de hábito eliminado (RN-HAB-06). */
export async function listDailyMissions(
  db: SqlDatabase,
  userId: string,
  gameDate: GameDate,
): Promise<DailyMission[]> {
  const rows = await db.getAllAsync<OccurrenceRow & { habit_archived: unknown }>(
    `SELECT ${PREFIXED_COLUMNS}, (h.archived_at IS NOT NULL) AS habit_archived
       FROM habit_occurrences o JOIN habits h ON h.id = o.habit_id
      WHERE o.user_id = ? AND o.game_date = ? ORDER BY o.created_at, o.id`,
    [userId, gameDate],
  );
  return rows.map((row) => ({ ...toOccurrence(row), habitArchived: row.habit_archived === 1 }));
}

/**
 * Marca la ocurrencia. La condición `status = 'PENDING' AND resolution_seq = ?`
 * hace de cerrojo optimista: si otra operación se adelantó, no cambia nada.
 */
export async function resolveOccurrence(
  db: SqlDatabase,
  params: { id: string; status: 'COMPLETED' | 'MISSED'; expectedSeq: number; resolutionSeq: number; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE habit_occurrences
        SET status = ?, resolved_at = ?, resolution_source = 'USER', resolution_seq = ?,
            updated_at = ?, version = version + 1
      WHERE id = ? AND status = 'PENDING' AND resolution_seq = ?`,
    [params.status, params.now, params.resolutionSeq, params.now, params.id, params.expectedSeq],
  );
  return result.changes === 1;
}

/** Deshacer (RN-DAY-07): vuelve a PENDING. El `resolution_seq` se conserva. */
export async function reopenOccurrence(
  db: SqlDatabase,
  params: { id: string; expectedSeq: number; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE habit_occurrences
        SET status = 'PENDING', resolved_at = NULL, resolution_source = NULL,
            updated_at = ?, version = version + 1
      WHERE id = ? AND status IN ('COMPLETED','MISSED') AND resolution_seq = ?`,
    [params.now, params.id, params.expectedSeq],
  );
  return result.changes === 1;
}

/**
 * Cierre de jornada (RN-CLOSE-02 paso 3, P-50): las pendientes pasan a MISSED
 * (o PAUSED si la jornada está en pausa) con `resolution_source = 'DAY_CLOSE'`,
 * para que deshacer Día Finalizado sepa cuáles tocó (RN-CLOSE-09).
 */
export async function closePendingOccurrences(
  db: SqlDatabase,
  params: { userId: string; gameDate: GameDate; ids: readonly string[]; to: 'MISSED' | 'PAUSED'; now: string },
): Promise<void> {
  for (const id of params.ids) {
    await db.runAsync(
      `UPDATE habit_occurrences
          SET status = ?, resolved_at = ?, resolution_source = 'DAY_CLOSE', updated_at = ?, version = version + 1
        WHERE id = ? AND user_id = ? AND game_date = ? AND status = 'PENDING'`,
      [params.to, params.now, params.now, id, params.userId, params.gameDate],
    );
  }
}

/** Deshacer Día Finalizado: las que cerró el cierre vuelven a PENDING (RN-CLOSE-09). */
export async function reopenDayCloseOccurrences(
  db: SqlDatabase,
  params: { userId: string; gameDate: GameDate; now: string },
): Promise<void> {
  await db.runAsync(
    `UPDATE habit_occurrences
        SET status = 'PENDING', resolved_at = NULL, resolution_source = NULL, updated_at = ?, version = version + 1
      WHERE user_id = ? AND game_date = ? AND resolution_source = 'DAY_CLOSE'`,
    [params.now, params.userId, params.gameDate],
  );
}
