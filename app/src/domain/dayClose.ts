import { CLASSIFICATION_THRESHOLDS, DAY_CUTOFF_HOUR, MIN_HP_HALF_UNITS } from '@/config/game';

import { addDays } from './schedule';
import type { CloseSource, DayClassification, GameDate, HabitOccurrence, HpHalfUnits } from './types';

/**
 * Cierre de jornada (RN-CLOSE-01..09, RN-MAP-02..09, P-50). Funciones puras:
 * deciden QUÉ pasa al cerrar; `dayCloseService` lo aplica en una transacción.
 */

/**
 * RN-MAP-02..04, C-14: clasificación SIN redondear, con aritmética entera
 * (84,6 % es Parcial: 11·100 = 1100 < 85·13 = 1105).
 */
export function classifyDay(completed: number, scheduled: number): DayClassification {
  if (scheduled === 0) return 'NO_ACTIVITY'; // RN-MAP-04: nunca Perfecto
  if (completed === scheduled) return 'PERFECT';
  if (completed * 100 >= CLASSIFICATION_THRESHOLDS.veryGood * scheduled) return 'VERY_GOOD';
  if (completed * 100 >= CLASSIFICATION_THRESHOLDS.partial * scheduled) return 'PARTIAL';
  return 'CRITICAL';
}

/** RN-CLOSE-07, P-30: Perfecto suma; "sin actividades" y "en pausa" se saltan; el resto rompe la racha. */
export function nextStreak(streakBefore: number, classification: DayClassification): number {
  if (classification === 'PERFECT') return streakBefore + 1;
  if (classification === 'NO_ACTIVITY' || classification === 'PAUSED') return streakBefore;
  return 0;
}

/** Porcentaje para mostrar (sin redondear para clasificar; aquí solo es texto). */
export function completionPercent(completed: number, scheduled: number): number | null {
  return scheduled === 0 ? null : (completed * 100) / scheduled;
}

/**
 * closeAt(D) = (D + 1) a las 04:00 hora local (ARCHITECTURE.md §8).
 * Es el instante del cierre automático y el límite para deshacer Día Finalizado.
 */
export function closeAtOf(gameDate: GameDate, cutoffHour: number = DAY_CUTOFF_HOUR): Date {
  const [y, m, d] = addDays(gameDate, 1).split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, cutoffHour, 0, 0, 0);
}

/**
 * RN-CLOSE-04: jornadas pendientes de cierre, en orden cronológico, desde la
 * siguiente a la última cerrada (o desde la primera jornada de la cuenta)
 * hasta AYER. La jornada actual nunca se cierra sola.
 */
export function datesToClose(lastClosed: GameDate | null, firstGameDate: GameDate, today: GameDate): GameDate[] {
  const dates: GameDate[] = [];
  let date = lastClosed === null ? firstGameDate : addDays(lastClosed, 1);
  while (date < today) {
    dates.push(date);
    date = addDays(date, 1);
  }
  return dates;
}

export interface DayCloseDecision {
  /** P-50, RN-MAP-09 (R-37): HP = 0 al cerrar → jornada "En pausa". */
  paused: boolean;
  /** RN-CLOSE-02 paso 3: pendientes → MISSED (o PAUSED si la jornada está en pausa). */
  pendingIds: string[];
  pendingTo: 'MISSED' | 'PAUSED';
  scheduledCount: number;
  completedCount: number;
  missedCount: number;
  classification: DayClassification;
  streakBefore: number;
  streakAfter: number;
}

/**
 * RN-CLOSE-02 pasos 1–3 y 7–9. Programadas = todas menos las canceladas.
 * Los desafíos (paso 4) los crea el servicio para cada `pendingIds` si no hay pausa;
 * los vencimientos y pérdidas (pasos 5–6) los hace la reconciliación de desafíos.
 */
export function decideDayClose(context: {
  occurrences: readonly Pick<HabitOccurrence, 'id' | 'status'>[];
  hpHalfUnits: HpHalfUnits;
  streakBefore: number;
}): DayCloseDecision {
  const counted = context.occurrences.filter((o) => o.status !== 'CANCELLED');
  const pendingIds = counted.filter((o) => o.status === 'PENDING').map((o) => o.id);
  const completedCount = counted.filter((o) => o.status === 'COMPLETED').length;
  const userMissed = counted.filter((o) => o.status === 'MISSED').length;
  const paused = context.hpHalfUnits <= MIN_HP_HALF_UNITS;

  const scheduledCount = counted.length;
  const missedCount = paused ? userMissed : userMissed + pendingIds.length;
  const classification = paused ? 'PAUSED' : classifyDay(completedCount, scheduledCount);
  return {
    paused,
    pendingIds,
    pendingTo: paused ? 'PAUSED' : 'MISSED',
    scheduledCount,
    completedCount,
    missedCount,
    classification,
    streakBefore: context.streakBefore,
    streakAfter: nextStreak(context.streakBefore, classification),
  };
}

/**
 * Instante de creación de los desafíos del cierre (RN-DES-09): el manual,
 * ahora; el automático, el cierre lógico de las 04:00 aunque se procese después.
 */
export function challengeCreatedAtForClose(gameDate: GameDate, source: CloseSource, now: Date): Date {
  return source === 'MANUAL' ? now : closeAtOf(gameDate);
}

export type CloseDayError = 'ALREADY_CLOSED' | 'NOT_CURRENT_DAY';
export type UndoCloseError = 'NOT_CLOSED' | 'NOT_MANUAL' | 'WINDOW_EXPIRED' | 'CHALLENGE_RESOLVED';

/**
 * RN-CLOSE-09, C-29: solo un cierre MANUAL y antes de las 04:00 de esa jornada.
 * `closeChallengesResolved`: algún desafío creado por el cierre ya no está
 * pendiente (se completó): deshacer ya no puede dejar la jornada como estaba (INT-19).
 */
export function decideUndoDayClose(context: {
  summary: { gameDate: GameDate; closeSource: CloseSource } | null;
  now: Date;
  closeChallengesResolved: boolean;
}): { ok: true } | { ok: false; error: UndoCloseError } {
  const { summary } = context;
  if (!summary) return { ok: false, error: 'NOT_CLOSED' };
  if (summary.closeSource !== 'MANUAL') return { ok: false, error: 'NOT_MANUAL' };
  if (context.now.getTime() >= closeAtOf(summary.gameDate).getTime()) return { ok: false, error: 'WINDOW_EXPIRED' };
  if (context.closeChallengesResolved) return { ok: false, error: 'CHALLENGE_RESOLVED' };
  return { ok: true };
}

export const DAY_CLOSE_ERROR_MESSAGES: Record<CloseDayError | UndoCloseError, string> = {
  ALREADY_CLOSED: 'Esta jornada ya está finalizada.',
  NOT_CURRENT_DAY: 'Solo puedes finalizar la jornada actual.',
  NOT_CLOSED: 'La jornada no está finalizada.',
  NOT_MANUAL: 'Esta jornada se cerró sola a las 04:00 y no se puede deshacer.',
  WINDOW_EXPIRED: 'Ya pasaron las 04:00: el cierre es definitivo.',
  CHALLENGE_RESOLVED: 'No se puede deshacer: ya completaste un desafío de esta jornada.',
};
