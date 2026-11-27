import type { GameDate } from '@/domain/types';

import type { SqlDatabase } from '../types';

/** Cierres de jornada (daily_summaries). La Fase 9 añade el cierre y su deshacer. */

/** ¿La jornada ya tiene cierre (Día Finalizado o automático)? (INT-09) */
export async function isDayClosed(db: SqlDatabase, userId: string, gameDate: GameDate): Promise<boolean> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM daily_summaries WHERE user_id = ? AND game_date = ?',
    [userId, gameDate],
  );
  return (row?.total ?? 0) > 0;
}
