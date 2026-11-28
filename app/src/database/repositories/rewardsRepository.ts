import type { RealReward, RewardRedemption } from '@/domain/types';

import type { SqlDatabase } from '../types';

/** Recompensas reales del usuario (rewards) y sus canjes (reward_redemptions). */

interface RewardRow {
  id: unknown;
  owner_user_id: unknown;
  name: unknown;
  cost_mate_leaves: unknown;
}

interface RedemptionRow {
  id: unknown;
  reward_id: unknown;
  name_snapshot: unknown;
  cost_snapshot: unknown;
  redeemed_at: unknown;
}

function toReward(row: RewardRow): RealReward {
  if (
    typeof row.id !== 'string' ||
    typeof row.owner_user_id !== 'string' ||
    typeof row.name !== 'string' ||
    typeof row.cost_mate_leaves !== 'number'
  ) {
    throw new Error('Recompensa inválida en la base de datos.');
  }
  return { id: row.id, userId: row.owner_user_id, name: row.name, costMateLeaves: row.cost_mate_leaves };
}

function toRedemption(row: RedemptionRow): RewardRedemption {
  if (
    typeof row.id !== 'string' ||
    typeof row.reward_id !== 'string' ||
    typeof row.name_snapshot !== 'string' ||
    typeof row.cost_snapshot !== 'number' ||
    typeof row.redeemed_at !== 'string'
  ) {
    throw new Error('Canje inválido en la base de datos.');
  }
  return {
    id: row.id,
    rewardId: row.reward_id,
    nameSnapshot: row.name_snapshot,
    costSnapshot: row.cost_snapshot,
    redeemedAt: row.redeemed_at,
  };
}

const REWARD_COLUMNS = 'id, owner_user_id, name, cost_mate_leaves';
const ACTIVE_REAL = "type = 'REAL_LIFE' AND is_active = 1 AND archived_at IS NULL";

/** El CHECK de la tabla exige costo ≥ 20 para REAL_LIFE (C-30): red de seguridad. */
export async function insertRealReward(
  db: SqlDatabase,
  params: { id: string; userId: string; name: string; cost: number; now: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO rewards (id, owner_user_id, type, name, cost_mate_leaves, created_at, updated_at)
     VALUES (?, ?, 'REAL_LIFE', ?, ?, ?, ?)`,
    [params.id, params.userId, params.name, params.cost, params.now, params.now],
  );
}

export async function listRealRewards(db: SqlDatabase, userId: string): Promise<RealReward[]> {
  const rows = await db.getAllAsync<RewardRow>(
    `SELECT ${REWARD_COLUMNS} FROM rewards WHERE owner_user_id = ? AND ${ACTIVE_REAL}
      ORDER BY cost_mate_leaves, created_at`,
    [userId],
  );
  return rows.map(toReward);
}

export async function findRealReward(db: SqlDatabase, userId: string, id: string): Promise<RealReward | null> {
  const row = await db.getFirstAsync<RewardRow>(
    `SELECT ${REWARD_COLUMNS} FROM rewards WHERE id = ? AND owner_user_id = ? AND ${ACTIVE_REAL}`,
    [id, userId],
  );
  return row ? toReward(row) : null;
}

/** Eliminar = archivar: los canjes pasados conservan su copia del nombre y del costo. */
export async function archiveRealReward(
  db: SqlDatabase,
  params: { id: string; userId: string; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE rewards SET archived_at = ?, updated_at = ? WHERE id = ? AND owner_user_id = ? AND archived_at IS NULL',
    [params.now, params.now, params.id, params.userId],
  );
  return result.changes === 1;
}

export async function insertRedemption(
  db: SqlDatabase,
  params: { id: string; userId: string; reward: RealReward; currencyTransactionId: string; now: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO reward_redemptions (id, user_id, reward_id, name_snapshot, cost_snapshot, currency_transaction_id, redeemed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.id,
      params.userId,
      params.reward.id,
      params.reward.name,
      params.reward.costMateLeaves,
      params.currencyTransactionId,
      params.now,
    ],
  );
}

/** ¿Ya existe este canje? (mismo operationId = mismo canje, INT-01). */
export async function redemptionExists(db: SqlDatabase, id: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM reward_redemptions WHERE id = ?', [id]);
  return (row?.total ?? 0) > 0;
}

export async function listRecentRedemptions(db: SqlDatabase, userId: string, limit: number): Promise<RewardRedemption[]> {
  const rows = await db.getAllAsync<RedemptionRow>(
    `SELECT id, reward_id, name_snapshot, cost_snapshot, redeemed_at FROM reward_redemptions
      WHERE user_id = ? ORDER BY redeemed_at DESC, id LIMIT ?`,
    [userId, limit],
  );
  return rows.map(toRedemption);
}
