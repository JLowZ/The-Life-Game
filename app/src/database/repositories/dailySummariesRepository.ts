import type { CloseSource, DailySummary, DayClassification, GameDate, MoodValue } from '@/domain/types';

import type { SqlDatabase } from '../types';

/** Cierres de jornada (daily_summaries): el historial del Mapa (RN-MAP-05, INT-09). */

interface SummaryRow {
  id: unknown;
  user_id: unknown;
  game_date: unknown;
  scheduled_count: unknown;
  completed_count: unknown;
  missed_count: unknown;
  classification: unknown;
  last_mood: unknown;
  streak_before: unknown;
  streak_after: unknown;
  message_id: unknown;
  close_source: unknown;
  closed_at: unknown;
}

const CLASSIFICATIONS: readonly DayClassification[] = ['PERFECT', 'VERY_GOOD', 'PARTIAL', 'CRITICAL', 'NO_ACTIVITY', 'PAUSED'];
const MOODS: readonly MoodValue[] = ['VERY_HAPPY', 'GOOD', 'NEUTRAL', 'DOWN', 'VERY_BAD'];

function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function toSummary(row: SummaryRow): DailySummary {
  if (
    typeof row.id !== 'string' ||
    typeof row.user_id !== 'string' ||
    typeof row.game_date !== 'string' ||
    !isInt(row.scheduled_count) ||
    !isInt(row.completed_count) ||
    !isInt(row.missed_count) ||
    !(CLASSIFICATIONS as readonly unknown[]).includes(row.classification) ||
    (row.last_mood !== null && !(MOODS as readonly unknown[]).includes(row.last_mood)) ||
    !isInt(row.streak_before) ||
    !isInt(row.streak_after) ||
    (row.message_id !== null && typeof row.message_id !== 'string') ||
    (row.close_source !== 'MANUAL' && row.close_source !== 'AUTO') ||
    typeof row.closed_at !== 'string'
  ) {
    throw new Error('Resumen de jornada inválido en la base de datos.');
  }
  return {
    id: row.id,
    userId: row.user_id,
    gameDate: row.game_date,
    scheduledCount: row.scheduled_count,
    completedCount: row.completed_count,
    missedCount: row.missed_count,
    classification: row.classification as DayClassification,
    lastMood: row.last_mood as MoodValue | null,
    streakBefore: row.streak_before,
    streakAfter: row.streak_after,
    messageId: row.message_id,
    closeSource: row.close_source as CloseSource,
    closedAt: row.closed_at,
  };
}

const COLUMNS = `id, user_id, game_date, scheduled_count, completed_count, missed_count, classification,
  last_mood, streak_before, streak_after, message_id, close_source, closed_at`;

/** ¿La jornada ya tiene cierre (Día Finalizado o automático)? (INT-09) */
export async function isDayClosed(db: SqlDatabase, userId: string, gameDate: GameDate): Promise<boolean> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM daily_summaries WHERE user_id = ? AND game_date = ?',
    [userId, gameDate],
  );
  return (row?.total ?? 0) > 0;
}

export async function findSummary(db: SqlDatabase, userId: string, gameDate: GameDate): Promise<DailySummary | null> {
  const row = await db.getFirstAsync<SummaryRow>(
    `SELECT ${COLUMNS} FROM daily_summaries WHERE user_id = ? AND game_date = ?`,
    [userId, gameDate],
  );
  return row ? toSummary(row) : null;
}

/** Resúmenes entre dos fechas, ambas incluidas (un mes del Mapa). */
export async function listSummaries(
  db: SqlDatabase,
  userId: string,
  from: GameDate,
  to: GameDate,
): Promise<DailySummary[]> {
  const rows = await db.getAllAsync<SummaryRow>(
    `SELECT ${COLUMNS} FROM daily_summaries WHERE user_id = ? AND game_date BETWEEN ? AND ? ORDER BY game_date`,
    [userId, from, to],
  );
  return rows.map(toSummary);
}

/**
 * Inserta el resumen. `INSERT OR IGNORE` + UNIQUE(user_id, game_date): si la
 * jornada ya estaba cerrada devuelve false y el servicio no aplica nada (INT-09).
 */
export async function insertSummary(db: SqlDatabase, summary: DailySummary): Promise<boolean> {
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO daily_summaries (id, user_id, game_date, scheduled_count, completed_count,
       missed_count, classification, last_mood, streak_before, streak_after, message_id, close_source, closed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      summary.id,
      summary.userId,
      summary.gameDate,
      summary.scheduledCount,
      summary.completedCount,
      summary.missedCount,
      summary.classification,
      summary.lastMood,
      summary.streakBefore,
      summary.streakAfter,
      summary.messageId,
      summary.closeSource,
      summary.closedAt,
    ],
  );
  return result.changes === 1;
}

/** Deshacer Día Finalizado (RN-CLOSE-09): solo un cierre MANUAL. */
export async function deleteManualSummary(db: SqlDatabase, userId: string, gameDate: GameDate): Promise<boolean> {
  const result = await db.runAsync(
    "DELETE FROM daily_summaries WHERE user_id = ? AND game_date = ? AND close_source = 'MANUAL'",
    [userId, gameDate],
  );
  return result.changes === 1;
}

/** Última jornada cerrada (la caché de player_profiles.last_closed_game_date se rehace con esto). */
export async function findLastClosedDate(db: SqlDatabase, userId: string): Promise<GameDate | null> {
  const row = await db.getFirstAsync<{ last: string | null }>(
    'SELECT MAX(game_date) AS last FROM daily_summaries WHERE user_id = ?',
    [userId],
  );
  return row?.last ?? null;
}
