import { addDays, weekdayIndex } from './schedule';
import type { GameDate } from './types';

/**
 * Rejilla del calendario del Mapa (RN-MAP-01). Función pura: semanas de lunes
 * a domingo; los huecos antes del día 1 y después del último son `null`.
 */
export function monthGrid(year: number, monthIndex: number): (GameDate | null)[][] {
  const first = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const cells: (GameDate | null)[] = Array.from({ length: weekdayIndex(first) }, () => null);
  for (let date = first; monthOf(date) === monthIndex; date = addDays(date, 1)) cells.push(date);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (GameDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Primer y último día del mes, para pedir sus resúmenes. */
export function monthRange(year: number, monthIndex: number): { from: GameDate; to: GameDate } {
  const dates = monthGrid(year, monthIndex).flat().filter((d): d is GameDate => d !== null);
  return { from: dates[0]!, to: dates[dates.length - 1]! };
}

/** Mes anterior o siguiente (`delta` = −1 o +1). */
export function shiftMonth(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
  const total = year * 12 + monthIndex + delta;
  return { year: Math.floor(total / 12), monthIndex: total % 12 };
}

export function monthOf(date: GameDate): number {
  return Number(date.slice(5, 7)) - 1;
}

export function yearOf(date: GameDate): number {
  return Number(date.slice(0, 4));
}
