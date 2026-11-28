import { listSummaries, findSummary } from '@/database/repositories/dailySummariesRepository';
import { listActiveHabits, listActiveSchedulesFrom } from '@/database/repositories/habitsRepository';
import { listOccurrencesForDate } from '@/database/repositories/occurrencesRepository';
import { monthRange } from '@/domain/calendar';
import { getGameDate } from '@/domain/gameDay';
import { isHabitScheduledOn } from '@/domain/schedule';
import type { DailySummary, GameDate, Habit, HabitOccurrence } from '@/domain/types';

import type { AppDeps } from './deps';

/**
 * Mapa (RN-MAP-01..09): trayectoria (resúmenes cerrados) y programación
 * (hábitos que tocan cada día desde hoy, calculados con la programación: R-26).
 * Solo lectura.
 */

export interface MapMonth {
  today: GameDate;
  summaries: Record<GameDate, DailySummary>;
  /** Hoy y días futuros del mes: nº de hábitos programados. */
  scheduledCounts: Record<GameDate, number>;
}

function habitsScheduledOn(
  habits: readonly Habit[],
  schedules: Awaited<ReturnType<typeof listActiveSchedulesFrom>>,
  date: GameDate,
): Habit[] {
  return habits.filter((habit) => isHabitScheduledOn(schedules.filter((s) => s.habitId === habit.id), date));
}

export async function loadMapMonth(deps: AppDeps, userId: string, year: number, monthIndex: number): Promise<MapMonth> {
  const today = getGameDate(deps.now());
  const { from, to } = monthRange(year, monthIndex);
  const [summaries, habits, schedules] = await Promise.all([
    listSummaries(deps.db, userId, from, to),
    listActiveHabits(deps.db, userId),
    listActiveSchedulesFrom(deps.db, userId, today),
  ]);
  const scheduledCounts: Record<GameDate, number> = {};
  for (let day = 1; day <= Number(to.slice(8, 10)); day += 1) {
    const date = `${from.slice(0, 8)}${String(day).padStart(2, '0')}`;
    if (date >= today) scheduledCounts[date] = habitsScheduledOn(habits, schedules, date).length;
  }
  return {
    today,
    summaries: Object.fromEntries(summaries.map((s) => [s.gameDate, s])),
    scheduledCounts,
  };
}

export type MapDayDetail =
  | { kind: 'CLOSED'; summary: DailySummary; occurrences: HabitOccurrence[] }
  | { kind: 'TODAY'; occurrences: HabitOccurrence[] }
  | { kind: 'FUTURE'; habits: Habit[] }
  | { kind: 'PAST_EMPTY' };

/** RN-MAP-06: al tocar un día se ven su resumen, su ánimo y su mensaje (o lo programado). */
export async function loadMapDay(deps: AppDeps, userId: string, gameDate: GameDate): Promise<MapDayDetail> {
  const today = getGameDate(deps.now());
  const summary = await findSummary(deps.db, userId, gameDate);
  if (summary) return { kind: 'CLOSED', summary, occurrences: await listOccurrencesForDate(deps.db, userId, gameDate) };
  if (gameDate === today) return { kind: 'TODAY', occurrences: await listOccurrencesForDate(deps.db, userId, gameDate) };
  if (gameDate < today) return { kind: 'PAST_EMPTY' };
  const [habits, schedules] = await Promise.all([
    listActiveHabits(deps.db, userId),
    listActiveSchedulesFrom(deps.db, userId, today),
  ]);
  return { kind: 'FUTURE', habits: habitsScheduledOn(habits, schedules, gameDate) };
}
