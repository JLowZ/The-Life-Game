import type { HabitDifficulty } from '@/domain/habits';
import { isHabitUnitCode } from '@/domain/habits';
import { weekdayIndex } from '@/domain/schedule';
import type { GameDate, HabitUnitCode } from '@/domain/types';

/** Textos de hábitos para la interfaz (en español). */

export const UNIT_LABELS: Record<HabitUnitCode, { singular: string; plural: string }> = {
  MINUTES: { singular: 'minuto', plural: 'minutos' },
  PAGES: { singular: 'página', plural: 'páginas' },
  REPETITIONS: { singular: 'repetición', plural: 'repeticiones' },
  KILOMETERS: { singular: 'km', plural: 'km' },
  GLASSES: { singular: 'vaso', plural: 'vasos' },
  TIMES: { singular: 'vez', plural: 'veces' },
};

/** "20 páginas", "1 vez", "3 abdominales" (unidad libre tal cual). */
export function formatQuantity(quantity: number, unit: string): string {
  if (!isHabitUnitCode(unit)) return `${quantity} ${unit}`;
  const label = UNIT_LABELS[unit];
  return `${quantity} ${quantity === 1 ? label.singular : label.plural}`;
}

export const DIFFICULTY_LABELS: Record<HabitDifficulty, string> = {
  NONE: 'Sin XP',
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
};

/** Índice 0 = lunes … 6 = domingo (igual que la máscara semanal). */
export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const WEEKDAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

/** 'Vie 27 nov' para una fecha de jornada 'YYYY-MM-DD'. */
export function formatGameDateShort(date: GameDate): string {
  const [, month, day] = date.split('-').map(Number) as [number, number, number];
  return `${WEEKDAY_SHORT[weekdayIndex(date)]} ${day} ${MONTHS_SHORT[month - 1]}`;
}
