import {
  CHALLENGE_DURATION_HOURS,
  CHALLENGE_LEAVES_DIVISOR,
  CHALLENGE_XP_PERCENT,
  GRACE_HOURS,
  MAX_HP_HALF_UNITS,
  MINI_CHALLENGE_PERCENT,
  MIN_HP_HALF_UNITS,
  NORMAL_CHALLENGE_PERCENT,
  PENALTY_HP_HALF_UNITS,
  RECOVERY_HP_HALF_UNITS,
} from '@/config/game';

import type { Challenge, ChallengeVariant, HpHalfUnits, MoodValue } from './types';

/**
 * Desafíos (RN-DES-xx, RN-HP-03..10). Funciones puras: deciden y devuelven
 * efectos; los servicios los aplican en una transacción.
 */

const HOUR_MS = 60 * 60 * 1000;
const PERCENT = 100;

/** RN-DES-15: normal 50 %, mini 10 %, hacia arriba y mínimo 1. Aritmética entera. */
export function challengeSize(targetQuantity: number, variant: ChallengeVariant): number {
  const percent = variant === 'MINI' ? MINI_CHALLENGE_PERCENT : NORMAL_CHALLENGE_PERCENT;
  return Math.max(1, Math.ceil((targetQuantity * percent) / PERCENT));
}

/** RN-DES-06: ½ de las Hojas (hacia abajo) y 20 % de la XP. 25 Hojas → 12; 30 XP → 6. */
export function challengeRewards(leaves: number, xp: number): { leaves: number; xp: number } {
  return {
    leaves: Math.floor(leaves / CHALLENGE_LEAVES_DIVISOR),
    xp: Math.floor((xp * CHALLENGE_XP_PERCENT) / PERCENT),
  };
}

/** RN-MOOD-04..07: Desanimado / Muy mal → mini; el resto o sin registro → normal. */
export function variantForMood(lastMood: MoodValue | null): ChallengeVariant {
  return lastMood === 'DOWN' || lastMood === 'VERY_BAD' ? 'MINI' : 'NORMAL';
}

/** RN-DES-10: plazo = creación + 72 h. */
export function challengeDeadline(createdAt: Date): Date {
  return new Date(createdAt.getTime() + CHALLENGE_DURATION_HOURS * HOUR_MS);
}

/** HP siempre entre 0 y 20 (INT-03). */
export function clampHp(units: number): HpHalfUnits {
  return Math.min(MAX_HP_HALF_UNITS, Math.max(MIN_HP_HALF_UNITS, units));
}

/** RN-DES-08: vencido si now ≥ deadline (aunque aún no se haya procesado). */
export function isOverdue(challenge: Pick<Challenge, 'deadlineAt'>, now: Date): boolean {
  return challenge.deadlineAt !== null && now.getTime() >= new Date(challenge.deadlineAt).getTime();
}

/** Milisegundos que faltan para el plazo (0 si venció; null si no tiene plazo). RN-DES-16. */
export function timeLeftMs(challenge: Pick<Challenge, 'deadlineAt'>, now: Date): number | null {
  if (challenge.deadlineAt === null) return null;
  return Math.max(0, new Date(challenge.deadlineAt).getTime() - now.getTime());
}

// ---------------------------------------------------------------------------
// Completar
// ---------------------------------------------------------------------------

export type CompleteChallengeError = 'NOT_PENDING' | 'OVERDUE' | 'NOT_COMPLETABLE';

export interface CompleteChallengeEffects {
  leavesDelta: number;
  xpDelta: number;
  /** challenge-reward:<challengeId> (DATA_MODEL.md §5). */
  rewardKey: string;
  /** Unidades de HP a sumar (0 si no corresponde). */
  hpDelta: number;
  hpReason: 'RECOVERY' | 'ZERO_HP_RECOVERY' | null;
  hpKey: string | null;
  /** RN-HP-10: a 0 HP, recuperar por otra vía cancela el Superdesafío. */
  cancelSuper: boolean;
}

export type CompleteChallengeDecision =
  | { ok: true; effects: CompleteChallengeEffects }
  | { ok: false; error: CompleteChallengeError };

export function decideCompleteChallenge(context: {
  challenge: Challenge;
  now: Date;
  hpHalfUnits: HpHalfUnits;
}): CompleteChallengeDecision {
  const { challenge, now, hpHalfUnits } = context;
  if (challenge.kind === 'SUPER') return { ok: false, error: 'NOT_COMPLETABLE' }; // se completa por tareas
  if (challenge.status !== 'PENDING') return { ok: false, error: 'NOT_PENDING' }; // INT-01
  if (isOverdue(challenge, now)) return { ok: false, error: 'OVERDUE' }; // RN-DES-08, INT-07

  const atZeroHp = hpHalfUnits <= MIN_HP_HALF_UNITS;
  let hpDelta = 0;
  let hpReason: CompleteChallengeEffects['hpReason'] = null;
  let hpKey: string | null = null;
  if (challenge.kind === 'RECOVERY') {
    hpDelta = RECOVERY_HP_HALF_UNITS; // RN-HP-06
    hpReason = atZeroHp ? 'ZERO_HP_RECOVERY' : 'RECOVERY';
    hpKey = `hp-recovery:${challenge.id}`;
  } else if (atZeroHp) {
    hpDelta = RECOVERY_HP_HALF_UNITS; // RN-HP-10: a 0 HP, cualquier desafío devuelve 1 unidad
    hpReason = 'ZERO_HP_RECOVERY';
    hpKey = `hp-zero-recovery:${challenge.id}`;
  }
  return {
    ok: true,
    effects: {
      leavesDelta: challenge.mateLeavesReward,
      xpDelta: challenge.xpReward,
      rewardKey: `challenge-reward:${challenge.id}`,
      hpDelta,
      hpReason,
      hpKey,
      cancelSuper: atZeroHp && hpDelta > 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Gracia y vencimiento
// ---------------------------------------------------------------------------

/**
 * RN-DES-10, INT-18: si el plazo venció con la app cerrada y aún no tuvo
 * gracia, el nuevo plazo es now + 12 h (una sola vez). Devuelve el nuevo
 * plazo o null si no corresponde.
 */
export function decideGrace(challenge: Challenge, now: Date): Date | null {
  if (challenge.kind !== 'MISSED_HABIT') return null;
  if (challenge.status !== 'PENDING' && challenge.status !== 'DECLINED') return null;
  if (challenge.graceApplied || !isOverdue(challenge, now)) return null;
  return new Date(now.getTime() + GRACE_HOURS * HOUR_MS);
}

export interface ExpiryEffects {
  /** hp-penalty:<occurrenceId>: una sola pérdida por ocurrencia (RN-HP-05, INT-02). */
  penaltyKey: string;
  deltaRequested: number;
  /** R-25: 0 si ya estaba a 0 HP. */
  deltaApplied: number;
  hpAfter: HpHalfUnits;
  /** RN-HP-06: solo si se perdió una vida de verdad. */
  createRecovery: boolean;
}

/** RN-DES-07, RN-HP-03: un desafío vencido sin completar resta 1 unidad, una vez. */
export function decideExpiry(challenge: Challenge, now: Date, hpHalfUnits: HpHalfUnits): ExpiryEffects | null {
  if (challenge.kind !== 'MISSED_HABIT' || challenge.sourceOccurrenceId === null) return null;
  if (challenge.status !== 'PENDING' && challenge.status !== 'DECLINED') return null;
  if (!isOverdue(challenge, now)) return null;
  const hpAfter = clampHp(hpHalfUnits - PENALTY_HP_HALF_UNITS);
  const deltaApplied = hpAfter - hpHalfUnits;
  return {
    penaltyKey: `hp-penalty:${challenge.sourceOccurrenceId}`,
    deltaRequested: -PENALTY_HP_HALF_UNITS,
    deltaApplied,
    hpAfter,
    createRecovery: deltaApplied < 0,
  };
}

export const CHALLENGE_ERROR_MESSAGES: Record<CompleteChallengeError, string> = {
  NOT_PENDING: 'Este desafío ya no está activo.',
  OVERDUE: 'El plazo de este desafío ya terminó.',
  NOT_COMPLETABLE: 'Este desafío se completa reto por reto.',
};
