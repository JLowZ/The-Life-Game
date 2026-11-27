import { UNDO_WINDOW_SECONDS } from '@/config/game';

import { levelFromXp } from './level';
import type { GameDate, HabitOccurrence, HpHalfUnits } from './types';

/**
 * Marcar una ocurrencia y deshacer el marcado (RN-DAY-03, RN-DAY-05,
 * RN-DAY-07, INT-01). El dominio DECIDE y devuelve los efectos; el servicio
 * los aplica en una transacción.
 */

export type MarkOutcome = 'COMPLETED' | 'MISSED';

export type MarkError =
  | 'ALREADY_RESOLVED' // ya estaba marcada: un doble toque no repite efectos
  | 'DAY_CLOSED' // la jornada de la ocurrencia ya terminó (ESC-04)
  | 'ZERO_HP'; // a 0 HP no se marca (RN-NAV-04, INT-17)

export interface MarkContext {
  occurrence: HabitOccurrence;
  outcome: MarkOutcome;
  /** Jornada actual, calculada con getGameDate(now). */
  currentGameDate: GameDate;
  /** true si ya hay un cierre (Día Finalizado) de esa jornada. */
  dayClosed: boolean;
  hpHalfUnits: HpHalfUnits;
}

export interface MarkEffects {
  status: MarkOutcome;
  resolutionSeq: number;
  /** Hojas y XP a acreditar (0 si es incumplido). */
  leavesDelta: number;
  xpDelta: number;
  /** Clave de la acreditación: habit-reward:<occurrenceId>:<seq> (DATA_MODEL.md §5). */
  rewardKey: string | null;
}

export type MarkDecision = { ok: true; effects: MarkEffects } | { ok: false; error: MarkError };

function isDayOpen(occurrenceDate: GameDate, currentGameDate: GameDate, dayClosed: boolean): boolean {
  return occurrenceDate === currentGameDate && !dayClosed;
}

export function decideMark(context: MarkContext): MarkDecision {
  const { occurrence, outcome } = context;
  // INT-01: solo desde PENDING. Repetir la operación no produce un segundo efecto.
  if (occurrence.status !== 'PENDING') return { ok: false, error: 'ALREADY_RESOLVED' };
  // RN-DAY-01, RN-DAY-03: solo con la jornada abierta.
  if (!isDayOpen(occurrence.gameDate, context.currentGameDate, context.dayClosed)) {
    return { ok: false, error: 'DAY_CLOSED' };
  }
  if (context.hpHalfUnits <= 0) return { ok: false, error: 'ZERO_HP' };

  const resolutionSeq = occurrence.resolutionSeq + 1;
  const completed = outcome === 'COMPLETED';
  return {
    ok: true,
    effects: {
      status: outcome,
      resolutionSeq,
      // RN-DAY-05: valor completo, una vez por marcado. RN-DAY-06 (desafío) llega en la Fase 7.
      leavesDelta: completed ? occurrence.mateLeavesReward : 0,
      xpDelta: completed ? occurrence.xpReward : 0,
      rewardKey: completed ? `habit-reward:${occurrence.id}:${resolutionSeq}` : null,
    },
  };
}

export type UndoError =
  | 'NOT_RESOLVED' // no hay nada que deshacer (o ya se deshizo)
  | 'NOT_UNDOABLE' // lo marcó el cierre de la jornada, no el usuario
  | 'WINDOW_EXPIRED' // pasaron más de 10 s (ESC-24)
  | 'DAY_CLOSED'
  | 'INSUFFICIENT_BALANCE'; // ya se gastaron las Hojas acreditadas (INT-05)

export interface UndoContext {
  occurrence: HabitOccurrence;
  now: Date;
  currentGameDate: GameDate;
  dayClosed: boolean;
  mateLeavesBalance: number;
}

export interface UndoEffects {
  /** Movimientos compensatorios (negativos). Clave: undo:<occurrenceId>:<seq>. */
  leavesDelta: number;
  xpDelta: number;
  reversalKey: string | null;
}

export type UndoDecision = { ok: true; effects: UndoEffects } | { ok: false; error: UndoError };

export function decideUndo(context: UndoContext): UndoDecision {
  const { occurrence } = context;
  if (occurrence.status !== 'COMPLETED' && occurrence.status !== 'MISSED') {
    return { ok: false, error: 'NOT_RESOLVED' };
  }
  if (occurrence.resolutionSource !== 'USER' || occurrence.resolvedAt === null) {
    return { ok: false, error: 'NOT_UNDOABLE' };
  }
  if (!isDayOpen(occurrence.gameDate, context.currentGameDate, context.dayClosed)) {
    return { ok: false, error: 'DAY_CLOSED' };
  }
  // RN-DAY-07: ventana de 10 s, límite incluido.
  const elapsedMs = context.now.getTime() - new Date(occurrence.resolvedAt).getTime();
  if (elapsedMs > UNDO_WINDOW_SECONDS * 1000) return { ok: false, error: 'WINDOW_EXPIRED' };

  if (occurrence.status === 'MISSED') {
    return { ok: true, effects: { leavesDelta: 0, xpDelta: 0, reversalKey: null } };
  }
  if (context.mateLeavesBalance < occurrence.mateLeavesReward) {
    return { ok: false, error: 'INSUFFICIENT_BALANCE' };
  }
  return {
    ok: true,
    effects: {
      leavesDelta: -occurrence.mateLeavesReward,
      xpDelta: -occurrence.xpReward,
      reversalKey: `undo:${occurrence.id}:${occurrence.resolutionSeq}`,
    },
  };
}

/** Nuevos saldos tras aplicar los deltas. El nivel se recalcula desde la XP (RN-XP-02). */
export function applyBalanceDeltas(
  balances: { mateLeavesBalance: number; xpTotal: number },
  leavesDelta: number,
  xpDelta: number,
): { mateLeavesBalance: number; xpTotal: number; level: number } {
  const mateLeavesBalance = balances.mateLeavesBalance + leavesDelta;
  const xpTotal = balances.xpTotal + xpDelta;
  if (mateLeavesBalance < 0 || xpTotal < 0) {
    throw new RangeError('Los saldos no pueden quedar negativos (INT-05).');
  }
  return { mateLeavesBalance, xpTotal, level: levelFromXp(xpTotal) };
}

/** Mensajes para el usuario (en español, sin tecnicismos). */
export const MARK_ERROR_MESSAGES: Record<MarkError | UndoError, string> = {
  ALREADY_RESOLVED: 'Este hábito ya está marcado.',
  DAY_CLOSED: 'La jornada de este hábito ya terminó.',
  ZERO_HP: 'Sin vidas no puedes marcar hábitos. Completa un desafío de recuperación.',
  NOT_RESOLVED: 'No hay nada que deshacer.',
  NOT_UNDOABLE: 'Este registro no se puede deshacer.',
  WINDOW_EXPIRED: 'Ya pasaron los 10 segundos para deshacer.',
  INSUFFICIENT_BALANCE: 'No se puede deshacer: ya usaste esas Hojas de mate.',
};
