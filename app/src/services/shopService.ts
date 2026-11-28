import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import {
  archiveRealReward,
  findRealReward,
  insertRealReward,
  insertRedemption,
  listRealRewards,
  listRecentRedemptions,
  redemptionExists,
} from '@/database/repositories/rewardsRepository';
import { runInTransaction } from '@/database/transaction';
import { RECENT_REDEMPTIONS_SHOWN } from '@/config/game';
import { decideRedeem, SHOP_ERROR_MESSAGES, validateReward, type RewardField, type RewardInput } from '@/domain/shop';
import type { RealReward, RewardRedemption } from '@/domain/types';

import type { AppDeps } from './deps';
import { applySpend } from './ledgerEffects';
import { refreshPlayerProfile } from './profileService';

/**
 * Tienda, Entrega 1: recompensas de la vida real (RN-SHOP-01..03, C-30).
 * Cada caso de uso es UNA transacción. Sin cosméticos (C-20).
 */

export type CreateRewardResult = { ok: true; rewardId: string } | { ok: false; errors: Partial<Record<RewardField, string>> };

/** RN-SHOP-02: el usuario crea la suya (nombre + costo ≥ 20 Hojas). Crear no está bloqueado a 0 HP. */
export async function createReward(deps: AppDeps, userId: string, input: RewardInput): Promise<CreateRewardResult> {
  const validation = validateReward(input);
  if (!validation.ok) return validation;
  const rewardId = deps.crypto.randomUUID();
  const nowIso = deps.now().toISOString();
  await runInTransaction(deps.db, () =>
    insertRealReward(deps.db, { id: rewardId, userId, ...validation.value, now: nowIso }),
  );
  return { ok: true, rewardId };
}

/** Eliminar una recompensa (archivarla). Los canjes pasados no cambian. */
export async function deleteReward(deps: AppDeps, userId: string, rewardId: string): Promise<boolean> {
  const nowIso = deps.now().toISOString();
  return runInTransaction(deps.db, () => archiveRealReward(deps.db, { id: rewardId, userId, now: nowIso }));
}

export type RedeemResult = { ok: true } | { ok: false; error: string };

/**
 * RN-SHOP-03, ESC-17: canjea una recompensa. `redemptionId` es el id de la
 * operación: repetir la MISMA operación (doble toque, reintento) no cobra dos
 * veces (INT-01); cada canje nuevo usa un id nuevo (canjes ilimitados, C-30).
 */
export async function redeemReward(
  deps: AppDeps,
  userId: string,
  rewardId: string,
  redemptionId: string,
): Promise<RedeemResult> {
  const nowIso = deps.now().toISOString();
  return runInTransaction(deps.db, async (): Promise<RedeemResult> => {
    if (await redemptionExists(deps.db, redemptionId)) return { ok: true };
    const reward = await findRealReward(deps.db, userId, rewardId);
    const profile = await getPlayerProfile(deps.db, userId);
    if (!reward || !profile) return { ok: false, error: SHOP_ERROR_MESSAGES.NOT_FOUND };

    const decision = decideRedeem({
      reward,
      redemptionId,
      mateLeavesBalance: profile.mateLeavesBalance,
      hpHalfUnits: profile.hpHalfUnits,
    });
    if (!decision.ok) return { ok: false, error: SHOP_ERROR_MESSAGES[decision.error] };

    const { transactionId } = await applySpend(deps, {
      profile,
      leavesDelta: decision.effects.leavesDelta,
      type: 'REWARD_REDEMPTION',
      sourceType: 'REDEMPTION',
      sourceId: redemptionId,
      idempotencyKey: decision.effects.idempotencyKey,
      nowIso,
    });
    await insertRedemption(deps.db, { id: redemptionId, userId, reward, currencyTransactionId: transactionId, now: nowIso });
    return { ok: true };
  });
}

export interface ShopData {
  rewards: RealReward[];
  recent: RewardRedemption[];
}

export async function loadShop(deps: AppDeps, userId: string): Promise<ShopData> {
  const [rewards, recent] = await Promise.all([
    listRealRewards(deps.db, userId),
    listRecentRedemptions(deps.db, userId, RECENT_REDEMPTIONS_SHOWN),
  ]);
  return { rewards, recent };
}

/** Recarga el HUD tras un canje (RN-NAV-03). */
export async function refreshAfterRedeem(deps: AppDeps, userId: string): Promise<void> {
  await refreshPlayerProfile(deps.db, userId);
}
