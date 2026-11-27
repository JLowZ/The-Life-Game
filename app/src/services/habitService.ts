import {
  archiveHabit,
  closeSchedulesFrom,
  findActiveHabit,
  insertHabit,
  insertSchedule,
  listActiveHabits,
  listSchedulesForHabit,
  updateHabit as updateHabitRow,
} from '@/database/repositories/habitsRepository';
import { runInTransaction } from '@/database/transaction';
import { getGameDate } from '@/domain/gameDay';
import { validateHabit, type HabitField, type HabitInput } from '@/domain/habits';
import { addDays, validateSchedule, type ScheduleInput } from '@/domain/schedule';
import type { GameDate, Habit, HabitSchedule } from '@/domain/types';

import type { AppDeps } from './deps';
import { ensureOccurrencesForDate } from './occurrenceService';

/**
 * Crear, editar y eliminar hábitos con su programación (RN-HAB-01..09).
 * Cada caso de uso es UNA transacción.
 */

export type HabitFormErrors = Partial<Record<HabitField | 'schedule', string>>;
export type HabitSaveResult = { ok: true; habitId: string } | { ok: false; errors: HabitFormErrors };

export interface HabitWithSchedule {
  habit: Habit;
  schedule: ScheduleInput | null;
}

function validateForm(
  habitInput: HabitInput,
  scheduleInput: ScheduleInput,
  today: GameDate,
): { ok: true; habit: ReturnType<typeof validateHabit> & { ok: true }; schedule: ScheduleInput } | { ok: false; errors: HabitFormErrors } {
  const habit = validateHabit(habitInput);
  const schedule = validateSchedule(scheduleInput, today);
  if (habit.ok && schedule.ok) return { ok: true, habit, schedule: schedule.value };
  return {
    ok: false,
    errors: { ...(habit.ok ? {} : habit.errors), ...(schedule.ok ? {} : { schedule: schedule.error }) },
  };
}

/** Una fila semanal, o una fila por fecha concreta. Vigentes desde hoy. */
async function insertScheduleRows(
  deps: AppDeps,
  habitId: string,
  schedule: ScheduleInput,
  today: GameDate,
  now: string,
): Promise<void> {
  if (schedule.type === 'WEEKLY') {
    await insertSchedule(deps.db, {
      id: deps.crypto.randomUUID(),
      habitId,
      type: 'WEEKLY',
      weekdays: schedule.weekdays,
      specificDate: null,
      validFrom: today,
      now,
    });
    return;
  }
  for (const date of schedule.dates) {
    await insertSchedule(deps.db, {
      id: deps.crypto.randomUUID(),
      habitId,
      type: 'SPECIFIC_DATE',
      weekdays: null,
      specificDate: date,
      validFrom: today,
      now,
    });
  }
}

export async function createHabit(
  deps: AppDeps,
  userId: string,
  habitInput: HabitInput,
  scheduleInput: ScheduleInput,
): Promise<HabitSaveResult> {
  const now = deps.now();
  const today = getGameDate(now);
  const form = validateForm(habitInput, scheduleInput, today);
  if (!form.ok) return form;
  const habitId = deps.crypto.randomUUID();
  const nowIso = now.toISOString();

  await runInTransaction(deps.db, async () => {
    await insertHabit(deps.db, { ...form.habit.value, id: habitId, userId, now: nowIso });
    await insertScheduleRows(deps, habitId, form.schedule, today, nowIso);
    // Si está programado para hoy, aparece ya en las Misiones del día.
    await ensureOccurrencesForDate(deps, userId, today);
  });
  return { ok: true, habitId };
}

/**
 * RN-HAB-05 y RN-HAB-07: los valores nuevos y la nueva programación solo
 * valen para el futuro. La ocurrencia de hoy, si ya existe, conserva su copia;
 * las cerradas no se tocan. Las futuras no tienen fila (R-26): se calculan
 * con los valores nuevos.
 */
export async function updateHabit(
  deps: AppDeps,
  userId: string,
  habitId: string,
  habitInput: HabitInput,
  scheduleInput: ScheduleInput,
): Promise<HabitSaveResult> {
  const now = deps.now();
  const today = getGameDate(now);
  const form = validateForm(habitInput, scheduleInput, today);
  if (!form.ok) return form;
  const nowIso = now.toISOString();

  return runInTransaction(deps.db, async (): Promise<HabitSaveResult> => {
    const updated = await updateHabitRow(deps.db, { ...form.habit.value, id: habitId, userId, now: nowIso });
    if (!updated) return { ok: false, errors: { name: 'Este hábito ya no existe.' } };
    await closeSchedulesFrom(deps.db, { habitId, today, yesterday: addDays(today, -1), now: nowIso });
    await insertScheduleRows(deps, habitId, form.schedule, today, nowIso);
    await ensureOccurrencesForDate(deps, userId, today);
    return { ok: true, habitId };
  });
}

/**
 * RN-HAB-06: deja de programarse; la ocurrencia de hoy se conserva y el
 * historial no se toca (eliminación lógica, R-14). Ejecutarlo dos veces no falla.
 */
export async function deleteHabit(deps: AppDeps, userId: string, habitId: string): Promise<boolean> {
  const now = deps.now();
  const today = getGameDate(now);
  const nowIso = now.toISOString();
  return runInTransaction(deps.db, async () => {
    const archived = await archiveHabit(deps.db, { id: habitId, userId, now: nowIso });
    if (archived) {
      // La programación termina hoy: mañana ya no aparece.
      await closeSchedulesFrom(deps.db, { habitId, today: addDays(today, 1), yesterday: today, now: nowIso });
    }
    return archived;
  });
}

/** Resume las filas de programación vigentes desde hoy en lo que muestra el formulario. */
export function summarizeSchedules(schedules: readonly HabitSchedule[], today: GameDate): ScheduleInput | null {
  const weekly = schedules.filter((s) => s.type === 'WEEKLY' && s.weekdays !== null);
  if (weekly.length > 0) {
    return { type: 'WEEKLY', weekdays: weekly.reduce((mask, s) => mask | (s.weekdays ?? 0), 0) };
  }
  const dates = schedules
    .map((s) => s.specificDate)
    .filter((date): date is GameDate => date !== null && date >= today)
    .sort();
  return dates.length > 0 ? { type: 'SPECIFIC_DATES', dates } : null;
}

export async function listHabits(deps: AppDeps, userId: string): Promise<HabitWithSchedule[]> {
  const today = getGameDate(deps.now());
  const habits = await listActiveHabits(deps.db, userId);
  const result: HabitWithSchedule[] = [];
  for (const habit of habits) {
    const schedules = await listSchedulesForHabit(deps.db, habit.id, today);
    result.push({ habit, schedule: summarizeSchedules(schedules, today) });
  }
  return result;
}

export async function getHabit(deps: AppDeps, userId: string, habitId: string): Promise<HabitWithSchedule | null> {
  const habit = await findActiveHabit(deps.db, userId, habitId);
  if (!habit) return null;
  const today = getGameDate(deps.now());
  const schedules = await listSchedulesForHabit(deps.db, habit.id, today);
  return { habit, schedule: summarizeSchedules(schedules, today) };
}
