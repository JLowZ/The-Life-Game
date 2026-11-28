import type { GameDate, HabitSchedule } from './types';

/**
 * Programación de hábitos (RN-HAB-03, RN-HAB-04, RN-HAB-07). Funciones puras.
 *
 * Las fechas de jornada son textos 'YYYY-MM-DD'. Para operar con ellas se usa
 * UTC a propósito: así sumar días o saber el día de la semana no depende de la
 * zona horaria ni del cambio de horario. (La hora local solo importa para
 * decidir QUÉ jornada es ahora: eso lo hace getGameDate.)
 */

export const ALL_WEEKDAYS_MASK = 127;
const DAY_MS = 24 * 60 * 60 * 1000;
const GAME_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseGameDate(date: GameDate): Date {
  if (!GAME_DATE_PATTERN.test(date)) throw new RangeError(`Fecha de jornada inválida: ${date}`);
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function formatUtcDate(date: Date): GameDate {
  return date.toISOString().slice(0, 10);
}

export function isValidGameDate(value: string): boolean {
  if (!GAME_DATE_PATTERN.test(value)) return false;
  return formatUtcDate(parseGameDate(value)) === value; // descarta 2026-02-30
}

export function addDays(date: GameDate, days: number): GameDate {
  return formatUtcDate(new Date(parseGameDate(date).getTime() + days * DAY_MS));
}

/** Índice del día: 0 = lunes … 6 = domingo. */
export function weekdayIndex(date: GameDate): number {
  return (parseGameDate(date).getUTCDay() + 6) % 7;
}

/** Bit del día en la máscara semanal (bit 0 = lunes … bit 6 = domingo). */
export function weekdayBit(index: number): number {
  return 1 << index;
}

export function maskFromWeekdays(indexes: readonly number[]): number {
  return indexes.reduce((mask, index) => mask | weekdayBit(index), 0);
}

export function weekdaysFromMask(mask: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter((index) => (mask & weekdayBit(index)) !== 0);
}

/** ¿La programación incluye esa jornada? Tiene en cuenta su vigencia. */
export function isScheduledOn(schedule: HabitSchedule, date: GameDate): boolean {
  if (date < schedule.validFrom) return false;
  if (schedule.validTo !== null && date > schedule.validTo) return false;
  if (schedule.type === 'SPECIFIC_DATE') return schedule.specificDate === date;
  return schedule.weekdays !== null && (schedule.weekdays & weekdayBit(weekdayIndex(date))) !== 0;
}

export function isHabitScheduledOn(schedules: readonly HabitSchedule[], date: GameDate): boolean {
  return schedules.some((schedule) => isScheduledOn(schedule, date));
}

/** Lo que el usuario elige en el formulario. */
export type ScheduleInput =
  | { type: 'WEEKLY'; weekdays: number }
  | { type: 'SPECIFIC_DATES'; dates: GameDate[] };

export type ScheduleValidation = { ok: true; value: ScheduleInput } | { ok: false; error: string };

/** Valida la programación: al menos un día; las fechas concretas, desde hoy en adelante. */
export function validateSchedule(input: ScheduleInput, today: GameDate): ScheduleValidation {
  if (input.type === 'WEEKLY') {
    if (!Number.isInteger(input.weekdays) || input.weekdays < 1 || input.weekdays > ALL_WEEKDAYS_MASK) {
      return { ok: false, error: 'Elige al menos un día de la semana.' };
    }
    return { ok: true, value: input };
  }
  const dates = [...new Set(input.dates)].sort();
  if (dates.length === 0) return { ok: false, error: 'Elige al menos una fecha.' };
  if (dates.some((date) => !isValidGameDate(date))) return { ok: false, error: 'Hay una fecha inválida.' };
  if (dates.some((date) => date < today)) {
    return { ok: false, error: 'No se pueden programar fechas pasadas.' };
  }
  return { ok: true, value: { type: 'SPECIFIC_DATES', dates } };
}

/**
 * Casilla de la tabla de programación del Mapa: marca o desmarca un día de la
 * semana (0 = lunes … 6 = domingo). Desde "sin días" o desde fechas concretas
 * pasa a semanal con solo ese día. Si no queda ningún día, devuelve null
 * (el hábito queda sin programar).
 */
export function toggleWeekday(schedule: ScheduleInput | null, index: number): ScheduleInput | null {
  if (!Number.isInteger(index) || index < 0 || index > 6) throw new RangeError(`Día inválido: ${index}`);
  const mask = schedule?.type === 'WEEKLY' ? schedule.weekdays ^ weekdayBit(index) : weekdayBit(index);
  return mask === 0 ? null : { type: 'WEEKLY', weekdays: mask };
}
