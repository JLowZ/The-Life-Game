import type { SqlDatabase } from '../types';

/**
 * Libros de movimientos de Hojas y XP (R-06). SOLO INSERT: nunca se editan
 * ni se borran filas; deshacer inserta un movimiento compensatorio.
 * La UNIQUE de `idempotency_key` es la red de seguridad contra dobles efectos (INT-01).
 */

export type CurrencyTransactionType =
  | 'HABIT_REWARD'
  | 'CHALLENGE_REWARD'
  | 'MISSION_REWARD'
  | 'REWARD_REDEMPTION'
  | 'COSMETIC_PURCHASE'
  | 'UNDO_REVERSAL';

export type XpTransactionType = 'HABIT_REWARD' | 'CHALLENGE_REWARD' | 'MISSION_REWARD' | 'UNDO_REVERSAL';

interface Movement<T> {
  id: string;
  userId: string;
  amount: number;
  type: T;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  now: string;
}

export async function insertCurrencyTransaction(
  db: SqlDatabase,
  movement: Movement<CurrencyTransactionType> & { balanceAfter: number },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO currency_transactions (id, user_id, amount, type, source_type, source_id,
       idempotency_key, balance_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movement.id,
      movement.userId,
      movement.amount,
      movement.type,
      movement.sourceType,
      movement.sourceId,
      movement.idempotencyKey,
      movement.balanceAfter,
      movement.now,
    ],
  );
}

export async function insertXpTransaction(
  db: SqlDatabase,
  movement: Movement<XpTransactionType> & { xpTotalAfter: number },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO xp_transactions (id, user_id, amount, type, source_type, source_id,
       idempotency_key, xp_total_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movement.id,
      movement.userId,
      movement.amount,
      movement.type,
      movement.sourceType,
      movement.sourceId,
      movement.idempotencyKey,
      movement.xpTotalAfter,
      movement.now,
    ],
  );
}

export type HpLedgerReason = 'MISSED_HABIT_PENALTY' | 'RECOVERY' | 'ZERO_HP_RECOVERY' | 'SUPER_CHALLENGE';

/** Libro de HP (INT-02, INT-03). R-25: a 0 HP se registra igual, con delta_applied = 0. */
export async function insertHpEntry(
  db: SqlDatabase,
  entry: {
    id: string;
    userId: string;
    reason: HpLedgerReason;
    deltaRequested: number;
    deltaApplied: number;
    sourceType: string;
    sourceId: string;
    idempotencyKey: string;
    hpAfter: number;
    now: string;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO hp_ledger_entries (id, user_id, reason, delta_requested, delta_applied, source_type,
       source_id, idempotency_key, hp_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.userId,
      entry.reason,
      entry.deltaRequested,
      entry.deltaApplied,
      entry.sourceType,
      entry.sourceId,
      entry.idempotencyKey,
      entry.hpAfter,
      entry.now,
    ],
  );
}

/** INT-14: el saldo guardado debe coincidir con la suma de sus movimientos. */
export async function sumLedgers(db: SqlDatabase, userId: string): Promise<{ leaves: number; xp: number }> {
  const leaves = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) AS total FROM currency_transactions WHERE user_id = ?',
    [userId],
  );
  const xp = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) AS total FROM xp_transactions WHERE user_id = ?',
    [userId],
  );
  return { leaves: leaves?.total ?? 0, xp: xp?.total ?? 0 };
}

