import { MIN_REAL_REWARD_COST, REWARD_MAX_COST, REWARD_NAME_MAX_LENGTH } from '@/config/game';

import { isZeroHp } from './hp';
import type { HpHalfUnits, RealReward } from './types';

/**
 * Tienda: recompensas de la vida real (RN-SHOP-01..03, C-30, INT-05, INT-17).
 * Funciones puras. Los cosméticos llegan después de la Entrega 1 (C-20).
 */

export interface RewardInput {
  name: string;
  cost: number;
}

export type RewardField = 'name' | 'cost';

export type RewardValidation =
  | { ok: true; value: { name: string; cost: number } }
  | { ok: false; errors: Partial<Record<RewardField, string>> };

/** RN-SHOP-02, ESC-29: nombre obligatorio y costo entero ≥ 20 Hojas. */
export function validateReward(input: RewardInput): RewardValidation {
  const errors: Partial<Record<RewardField, string>> = {};
  const name = input.name.trim();
  if (name.length === 0) errors.name = 'Ponle un nombre a tu recompensa.';
  else if (name.length > REWARD_NAME_MAX_LENGTH) errors.name = `Máximo ${REWARD_NAME_MAX_LENGTH} caracteres.`;
  if (!Number.isInteger(input.cost) || input.cost < MIN_REAL_REWARD_COST) {
    errors.cost = `El costo mínimo es ${MIN_REAL_REWARD_COST} Hojas de mate.`;
  } else if (input.cost > REWARD_MAX_COST) {
    errors.cost = `El costo máximo es ${REWARD_MAX_COST} Hojas de mate.`;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, cost: input.cost } };
}

export type RedeemError = 'ZERO_HP' | 'INSUFFICIENT_BALANCE';

export interface RedeemEffects {
  /** Movimiento negativo de Hojas; la XP y el HP no cambian (RN-ECO-04). */
  leavesDelta: number;
  /** Clave del canje: redeem:<redemptionId> (DATA_MODEL.md §5). */
  idempotencyKey: string;
}

/**
 * RN-SHOP-03, ESC-17: un canje valida el saldo y descuenta las Hojas, de forma
 * idempotente. Canjes ilimitados (C-30). Bloqueado a 0 HP (RN-NAV-04).
 */
export function decideRedeem(context: {
  reward: RealReward;
  redemptionId: string;
  mateLeavesBalance: number;
  hpHalfUnits: HpHalfUnits;
}): { ok: true; effects: RedeemEffects } | { ok: false; error: RedeemError } {
  if (isZeroHp(context.hpHalfUnits)) return { ok: false, error: 'ZERO_HP' };
  // INT-05: sin gasto con saldo insuficiente; el saldo nunca es negativo.
  if (context.mateLeavesBalance < context.reward.costMateLeaves) return { ok: false, error: 'INSUFFICIENT_BALANCE' };
  return {
    ok: true,
    effects: { leavesDelta: -context.reward.costMateLeaves, idempotencyKey: `redeem:${context.redemptionId}` },
  };
}

/** Hojas que faltan para poder canjear (0 si ya alcanza). */
export function leavesMissing(cost: number, balance: number): number {
  return Math.max(0, cost - balance);
}

export const SHOP_ERROR_MESSAGES: Record<RedeemError | 'NOT_FOUND', string> = {
  ZERO_HP: 'Sin vidas no puedes canjear recompensas. Completa un desafío de recuperación.',
  INSUFFICIENT_BALANCE: 'Aún no tienes suficientes Hojas de mate para esta recompensa.',
  NOT_FOUND: 'Esta recompensa ya no existe.',
};
