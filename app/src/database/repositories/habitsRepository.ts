import { isHabitCategoryId } from '@/domain/categories';
import type { NormalizedHabit } from '@/domain/habits';
import type { GameDate, Habit, HabitSchedule } from '@/domain/types';

import type { SqlDatabase } from '../types';

/** Hábitos y su programación (DATA_MODEL.md §3.2). */

interface HabitRow {
  id: unknown;
  user_id: unknown;
  category_id: unknown;
  name: unknown;
  target_quantity: unknown;
  unit: unknown;
  mate_leaves_reward: unknown;
  xp_reward: unknown;
  archived_at: unknown;
}

function toHabit(row: HabitRow): Habit {
  if (
    typeof row.id !== 'string' ||
    typeof row.user_id !== 'string' ||
    !isHabitCategoryId(row.category_id) ||
    typeof row.name !== 'string' ||
    typeof row.target_quantity !== 'number' ||
    typeof row.unit !== 'string' ||
    typeof row.mate_leaves_reward !== 'number' ||
    typeof row.xp_reward !== 'number' ||
    (row.archived_at !== null && typeof row.archived_at !== 'string')
  ) {
    throw new Error('Hábito inválido en la base de datos.');
  }
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    name: row.name,
    targetQuantity: row.target_quantity,
    unit: row.unit,
    mateLeavesReward: row.mate_leaves_reward,
    xpReward: row.xp_reward,
    archivedAt: row.archived_at,
  };
}

const HABIT_COLUMNS =
  'id, user_id, category_id, name, target_quantity, unit, mate_leaves_reward, xp_reward, archived_at';

export async function insertHabit(
  db: SqlDatabase,
  habit: NormalizedHabit & { id: string; userId: string; now: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO habits (id, user_id, origin, category_id, name, target_quantity, unit,
       mate_leaves_reward, xp_reward, created_at, updated_at)
     VALUES (?, ?, 'CUSTOM', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.userId,
      habit.categoryId,
      habit.name,
      habit.targetQuantity,
      habit.unit,
      habit.mateLeavesReward,
      habit.xpReward,
      habit.now,
      habit.now,
    ],
  );
}

export async function updateHabit(
  db: SqlDatabase,
  habit: NormalizedHabit & { id: string; userId: string; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE habits SET category_id = ?, name = ?, target_quantity = ?, unit = ?,
       mate_leaves_reward = ?, xp_reward = ?, updated_at = ?, version = version + 1
     WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
    [
      habit.categoryId,
      habit.name,
      habit.targetQuantity,
      habit.unit,
      habit.mateLeavesReward,
      habit.xpReward,
      habit.now,
      habit.id,
      habit.userId,
    ],
  );
  return result.changes === 1;
}

/** Eliminación lógica (R-14): el historial sigue apuntando al hábito. */
export async function archiveHabit(
  db: SqlDatabase,
  params: { id: string; userId: string; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE habits SET archived_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
    [params.now, params.now, params.id, params.userId],
  );
  return result.changes === 1;
}

export async function findActiveHabit(db: SqlDatabase, userId: string, id: string): Promise<Habit | null> {
  const row = await db.getFirstAsync<HabitRow>(
    `SELECT ${HABIT_COLUMNS} FROM habits WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
    [id, userId],
  );
  return row ? toHabit(row) : null;
}

export async function listActiveHabits(db: SqlDatabase, userId: string): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT ${HABIT_COLUMNS} FROM habits WHERE user_id = ? AND archived_at IS NULL ORDER BY created_at`,
    [userId],
  );
  return rows.map(toHabit);
}

// ---------------------------------------------------------------------------
// Programación
// ---------------------------------------------------------------------------

interface ScheduleRow {
  id: unknown;
  habit_id: unknown;
  type: unknown;
  weekdays: unknown;
  specific_date: unknown;
  valid_from: unknown;
  valid_to: unknown;
}

function toSchedule(row: ScheduleRow): HabitSchedule {
  if (
    typeof row.id !== 'string' ||
    typeof row.habit_id !== 'string' ||
    (row.type !== 'WEEKLY' && row.type !== 'SPECIFIC_DATE') ||
    (row.weekdays !== null && typeof row.weekdays !== 'number') ||
    (row.specific_date !== null && typeof row.specific_date !== 'string') ||
    typeof row.valid_from !== 'string' ||
    (row.valid_to !== null && typeof row.valid_to !== 'string')
  ) {
    throw new Error('Programación inválida en la base de datos.');
  }
  return {
    id: row.id,
    habitId: row.habit_id,
    type: row.type,
    weekdays: row.weekdays,
    specificDate: row.specific_date,
    validFrom: row.valid_from,
    validTo: row.valid_to,
  };
}

const SCHEDULE_COLUMNS = 's.id, s.habit_id, s.type, s.weekdays, s.specific_date, s.valid_from, s.valid_to';

export async function insertSchedule(
  db: SqlDatabase,
  schedule: Omit<HabitSchedule, 'validTo'> & { now: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO habit_schedules (id, habit_id, type, weekdays, specific_date, valid_from, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      schedule.id,
      schedule.habitId,
      schedule.type,
      schedule.weekdays,
      schedule.specificDate,
      schedule.validFrom,
      schedule.now,
      schedule.now,
    ],
  );
}

/** Programaciones vigentes desde `fromDate` (sin fin o con fin ≥ fromDate). */
export async function listSchedulesForHabit(
  db: SqlDatabase,
  habitId: string,
  fromDate: GameDate,
): Promise<HabitSchedule[]> {
  const rows = await db.getAllAsync<ScheduleRow>(
    `SELECT ${SCHEDULE_COLUMNS} FROM habit_schedules s
      WHERE s.habit_id = ? AND (s.valid_to IS NULL OR s.valid_to >= ?) ORDER BY s.valid_from, s.specific_date`,
    [habitId, fromDate],
  );
  return rows.map(toSchedule);
}

/** Programaciones de los hábitos activos de un usuario que cubren `date`. */
export async function listActiveSchedulesForUser(
  db: SqlDatabase,
  userId: string,
  date: GameDate,
): Promise<HabitSchedule[]> {
  const rows = await db.getAllAsync<ScheduleRow>(
    `SELECT ${SCHEDULE_COLUMNS} FROM habit_schedules s
       JOIN habits h ON h.id = s.habit_id
      WHERE h.user_id = ? AND h.archived_at IS NULL
        AND s.valid_from <= ? AND (s.valid_to IS NULL OR s.valid_to >= ?)`,
    [userId, date, date],
  );
  return rows.map(toSchedule);
}

/**
 * Cierra la programación vigente de un hábito para que solo cambie el futuro
 * (RN-HAB-07, C-07): las filas que empezaron antes de `today` terminan ayer;
 * las que empiezan hoy o después nunca generaron historial y se borran.
 */
export async function closeSchedulesFrom(
  db: SqlDatabase,
  params: { habitId: string; today: GameDate; yesterday: GameDate; now: string },
): Promise<void> {
  await db.runAsync(
    'DELETE FROM habit_schedules WHERE habit_id = ? AND valid_from >= ?',
    [params.habitId, params.today],
  );
  await db.runAsync(
    `UPDATE habit_schedules SET valid_to = ?, updated_at = ?, version = version + 1
      WHERE habit_id = ? AND (valid_to IS NULL OR valid_to >= ?)`,
    [params.yesterday, params.now, params.habitId, params.today],
  );
}
