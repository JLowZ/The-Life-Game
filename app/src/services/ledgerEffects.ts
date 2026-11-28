import {
  insertCurrencyTransaction,
  insertHpEntry,
  insertXpTransaction,
  type CurrencyTransactionType,
  type HpLedgerReason,
  type XpTransactionType,
} from '@/database/repositories/ledgerRepository';
import { updatePlayerBalances, updatePlayerHp } from '@/database/repositories/playerProfilesRepository';
import { clampHp } from '@/domain/challenges';
import { applyBalanceDeltas } from '@/domain/habitMarking';
import type { PlayerProfile } from '@/domain/types';

import type { AppDeps } from './deps';

/**
 * Aplica efectos económicos DENTRO de una transacción ya abierta: inserta los
 * movimientos (con su clave de idempotencia, R-06) y actualiza la caché de
 * saldos del perfil. Lo usan hábitos, desafíos y misiones.
 */

export async function applyRewards(
  deps: AppDeps,
  params: {
    profile: PlayerProfile;
    leavesDelta: number;
    xpDelta: number;
    type: CurrencyTransactionType & XpTransactionType;
    sourceType: string;
    sourceId: string;
    idempotencyKey: string;
    nowIso: string;
  },
): Promise<PlayerProfile> {
  const { profile, leavesDelta, xpDelta, nowIso } = params;
  if (leavesDelta === 0 && xpDelta === 0) return profile;
  const balances = applyBalanceDeltas(profile, leavesDelta, xpDelta);
  const base = {
    userId: profile.userId,
    type: params.type,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    idempotencyKey: params.idempotencyKey,
    now: nowIso,
  };
  if (leavesDelta !== 0) {
    await insertCurrencyTransaction(deps.db, {
      ...base,
      id: deps.crypto.randomUUID(),
      amount: leavesDelta,
      balanceAfter: balances.mateLeavesBalance,
    });
  }
  if (xpDelta !== 0) {
    await insertXpTransaction(deps.db, {
      ...base,
      id: deps.crypto.randomUUID(),
      amount: xpDelta,
      xpTotalAfter: balances.xpTotal,
    });
  }
  await updatePlayerBalances(deps.db, { userId: profile.userId, ...balances, now: nowIso });
  return { ...profile, ...balances };
}

/**
 * Gasto de Hojas (canje; después, cosméticos). Solo toca las Hojas: la XP y el
 * nivel no cambian (RN-ECO-04). Devuelve el id del movimiento para enlazar el canje.
 */
export async function applySpend(
  deps: AppDeps,
  params: {
    profile: PlayerProfile;
    leavesDelta: number;
    type: Extract<CurrencyTransactionType, 'REWARD_REDEMPTION' | 'COSMETIC_PURCHASE'>;
    sourceType: string;
    sourceId: string;
    idempotencyKey: string;
    nowIso: string;
  },
): Promise<{ profile: PlayerProfile; transactionId: string }> {
  const { profile } = params;
  if (params.leavesDelta >= 0) throw new RangeError('Un gasto debe ser negativo.');
  const balances = applyBalanceDeltas(profile, params.leavesDelta, 0); // INT-05: lanza si quedara negativo
  const transactionId = deps.crypto.randomUUID();
  await insertCurrencyTransaction(deps.db, {
    id: transactionId,
    userId: profile.userId,
    amount: params.leavesDelta,
    type: params.type,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    idempotencyKey: params.idempotencyKey,
    balanceAfter: balances.mateLeavesBalance,
    now: params.nowIso,
  });
  await updatePlayerBalances(deps.db, { userId: profile.userId, ...balances, now: params.nowIso });
  return { profile: { ...profile, ...balances }, transactionId };
}

/** Cambia el HP con su movimiento en el libro (INT-02, INT-03). Devuelve el perfil y el id del movimiento. */
export async function applyHpChange(
  deps: AppDeps,
  params: {
    profile: PlayerProfile;
    deltaRequested: number;
    reason: HpLedgerReason;
    sourceType: string;
    sourceId: string;
    idempotencyKey: string;
    nowIso: string;
  },
): Promise<{ profile: PlayerProfile; entryId: string; deltaApplied: number }> {
  const { profile } = params;
  const hpAfter = clampHp(profile.hpHalfUnits + params.deltaRequested);
  const deltaApplied = hpAfter - profile.hpHalfUnits;
  const entryId = deps.crypto.randomUUID();
  await insertHpEntry(deps.db, {
    id: entryId,
    userId: profile.userId,
    reason: params.reason,
    deltaRequested: params.deltaRequested,
    deltaApplied,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    idempotencyKey: params.idempotencyKey,
    hpAfter,
    now: params.nowIso,
  });
  if (deltaApplied !== 0) await updatePlayerHp(deps.db, { userId: profile.userId, hpHalfUnits: hpAfter, now: params.nowIso });
  return { profile: { ...profile, hpHalfUnits: hpAfter }, entryId, deltaApplied };
}
