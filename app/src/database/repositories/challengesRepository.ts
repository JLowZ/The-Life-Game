import type { Challenge, ChallengeKind, ChallengeStatus, ChallengeVariant } from '@/domain/types';

import type { SqlDatabase } from '../types';

/** Desafíos (DATA_MODEL.md §3.4). La forma de cada tipo la garantiza un CHECK de la tabla. */

interface ChallengeRow {
  id: unknown;
  user_id: unknown;
  kind: unknown;
  variant: unknown;
  source_occurrence_id: unknown;
  source_game_date: unknown;
  source_penalty_id: unknown;
  habit_id: unknown;
  title: unknown;
  target_quantity: unknown;
  unit: unknown;
  status: unknown;
  deadline_at: unknown;
  grace_applied: unknown;
  mate_leaves_reward: unknown;
  xp_reward: unknown;
  created_at: unknown;
}

const KINDS: readonly ChallengeKind[] = ['MISSED_HABIT', 'RECOVERY', 'SUPER'];
const STATUSES: readonly ChallengeStatus[] = ['PENDING', 'COMPLETED', 'DECLINED', 'EXPIRED', 'CANCELLED'];

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function toChallenge(row: ChallengeRow): Challenge {
  if (
    typeof row.id !== 'string' ||
    typeof row.user_id !== 'string' ||
    !KINDS.includes(row.kind as ChallengeKind) ||
    (row.variant !== null && row.variant !== 'NORMAL' && row.variant !== 'MINI') ||
    !nullableString(row.source_occurrence_id) ||
    !nullableString(row.source_game_date) ||
    !nullableString(row.source_penalty_id) ||
    !nullableString(row.habit_id) ||
    typeof row.title !== 'string' ||
    (row.target_quantity !== null && typeof row.target_quantity !== 'number') ||
    !nullableString(row.unit) ||
    !STATUSES.includes(row.status as ChallengeStatus) ||
    !nullableString(row.deadline_at) ||
    typeof row.grace_applied !== 'number' ||
    typeof row.mate_leaves_reward !== 'number' ||
    typeof row.xp_reward !== 'number' ||
    typeof row.created_at !== 'string'
  ) {
    throw new Error('Desafío inválido en la base de datos.');
  }
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as ChallengeKind,
    variant: row.variant as ChallengeVariant | null,
    sourceOccurrenceId: row.source_occurrence_id,
    sourceGameDate: row.source_game_date,
    sourcePenaltyId: row.source_penalty_id,
    habitId: row.habit_id,
    title: row.title,
    targetQuantity: row.target_quantity,
    unit: row.unit,
    status: row.status as ChallengeStatus,
    deadlineAt: row.deadline_at,
    graceApplied: row.grace_applied === 1,
    mateLeavesReward: row.mate_leaves_reward,
    xpReward: row.xp_reward,
    createdAt: row.created_at,
  };
}

const COLUMNS = `id, user_id, kind, variant, source_occurrence_id, source_game_date, source_penalty_id,
  habit_id, title, target_quantity, unit, status, deadline_at, grace_applied, mate_leaves_reward,
  xp_reward, created_at`;

interface NewChallengeBase {
  id: string;
  userId: string;
  habitId: string;
  title: string;
  targetQuantity: number;
  unit: string;
  mateLeavesReward: number;
  xpReward: number;
  now: string;
}

/** Desafío por incumplimiento. UNIQUE(source_occurrence_id): uno por ocurrencia (INT-06). */
export async function insertMissedHabitChallenge(
  db: SqlDatabase,
  challenge: NewChallengeBase & {
    variant: ChallengeVariant;
    sourceOccurrenceId: string;
    sourceGameDate: string;
    deadlineAt: string;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO challenges (id, user_id, kind, variant, source_occurrence_id, source_game_date, habit_id,
       title, target_quantity, unit, status, deadline_at, mate_leaves_reward, xp_reward, created_at, updated_at)
     VALUES (?, ?, 'MISSED_HABIT', ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`,
    [
      challenge.id,
      challenge.userId,
      challenge.variant,
      challenge.sourceOccurrenceId,
      challenge.sourceGameDate,
      challenge.habitId,
      challenge.title,
      challenge.targetQuantity,
      challenge.unit,
      challenge.deadlineAt,
      challenge.mateLeavesReward,
      challenge.xpReward,
      challenge.now,
      challenge.now,
    ],
  );
}

/** Desafío de recuperación. UNIQUE(source_penalty_id): uno por vida perdida (P-12). */
export async function insertRecoveryChallenge(
  db: SqlDatabase,
  challenge: NewChallengeBase & { sourcePenaltyId: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO challenges (id, user_id, kind, source_penalty_id, habit_id, title, target_quantity, unit,
       status, mate_leaves_reward, xp_reward, created_at, updated_at)
     VALUES (?, ?, 'RECOVERY', ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`,
    [
      challenge.id,
      challenge.userId,
      challenge.sourcePenaltyId,
      challenge.habitId,
      challenge.title,
      challenge.targetQuantity,
      challenge.unit,
      challenge.mateLeavesReward,
      challenge.xpReward,
      challenge.now,
      challenge.now,
    ],
  );
}

export async function findChallenge(db: SqlDatabase, userId: string, id: string): Promise<Challenge | null> {
  const row = await db.getFirstAsync<ChallengeRow>(
    `SELECT ${COLUMNS} FROM challenges WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return row ? toChallenge(row) : null;
}

export async function findChallengeByOccurrence(db: SqlDatabase, occurrenceId: string): Promise<Challenge | null> {
  const row = await db.getFirstAsync<ChallengeRow>(
    `SELECT ${COLUMNS} FROM challenges WHERE source_occurrence_id = ?`,
    [occurrenceId],
  );
  return row ? toChallenge(row) : null;
}

/** Activos: PENDING y DECLINED (un mini rechazado aún puede vencer o pasarse al normal). */
export async function listActiveChallenges(db: SqlDatabase, userId: string): Promise<Challenge[]> {
  const rows = await db.getAllAsync<ChallengeRow>(
    `SELECT ${COLUMNS} FROM challenges
      WHERE user_id = ? AND status IN ('PENDING','DECLINED')
      ORDER BY CASE WHEN deadline_at IS NULL THEN 1 ELSE 0 END, deadline_at, created_at`,
    [userId],
  );
  return rows.map(toChallenge);
}

/** Desafíos por incumplimiento activos cuyo plazo ya pasó (para la gracia y el vencimiento). */
export async function listOverdueChallenges(db: SqlDatabase, userId: string, nowIso: string): Promise<Challenge[]> {
  const rows = await db.getAllAsync<ChallengeRow>(
    `SELECT ${COLUMNS} FROM challenges
      WHERE user_id = ? AND kind = 'MISSED_HABIT' AND status IN ('PENDING','DECLINED') AND deadline_at <= ?
      ORDER BY deadline_at`,
    [userId, nowIso],
  );
  return rows.map(toChallenge);
}

/** Deshacer un incumplimiento (RN-DAY-07): borra su desafío solo si aún no tuvo efectos. */
export async function deletePendingChallengeOfOccurrence(db: SqlDatabase, occurrenceId: string): Promise<boolean> {
  const result = await db.runAsync(
    "DELETE FROM challenges WHERE source_occurrence_id = ? AND status = 'PENDING'",
    [occurrenceId],
  );
  return result.changes === 1;
}

/** Cambia el estado solo si sigue en `expected` (cerrojo optimista). */
export async function transitionChallenge(
  db: SqlDatabase,
  params: { id: string; expected: ChallengeStatus[]; to: ChallengeStatus; now: string },
): Promise<boolean> {
  const placeholders = params.expected.map(() => '?').join(', ');
  const completedAt = params.to === 'COMPLETED' ? params.now : null;
  const result = await db.runAsync(
    `UPDATE challenges SET status = ?, completed_at = COALESCE(?, completed_at), resolved_at = ?,
       updated_at = ?, version = version + 1
     WHERE id = ? AND status IN (${placeholders})`,
    [params.to, completedAt, params.now, params.now, params.id, ...params.expected],
  );
  return result.changes === 1;
}

/** Gracia de 12 h, una sola vez (INT-18). */
export async function applyGrace(
  db: SqlDatabase,
  params: { id: string; deadlineAt: string; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE challenges SET deadline_at = ?, grace_applied = 1, updated_at = ?, version = version + 1
      WHERE id = ? AND grace_applied = 0`,
    [params.deadlineAt, params.now, params.id],
  );
  return result.changes === 1;
}

/** RN-HP-10: a 0 HP, recuperar por otra vía cancela el Superdesafío activo (si lo hay). */
export async function cancelActiveSuperChallenge(db: SqlDatabase, userId: string, now: string): Promise<void> {
  await db.runAsync(
    `UPDATE challenges SET status = 'CANCELLED', resolved_at = ?, updated_at = ?, version = version + 1
      WHERE user_id = ? AND kind = 'SUPER' AND status = 'PENDING'`,
    [now, now, userId],
  );
}
