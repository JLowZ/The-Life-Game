import type { GameDate, MoodValue } from '@/domain/types';

import type { SqlDatabase } from '../types';

const MOODS: readonly MoodValue[] = ['VERY_HAPPY', 'GOOD', 'NEUTRAL', 'DOWN', 'VERY_BAD'];

/** Último estado de ánimo de la jornada (RN-MOOD-08), o null si no se registró ninguno. */
export async function getLastMood(db: SqlDatabase, userId: string, gameDate: GameDate): Promise<MoodValue | null> {
  const row = await db.getFirstAsync<{ mood: unknown }>(
    `SELECT mood FROM mood_entries WHERE user_id = ? AND game_date = ?
      ORDER BY recorded_at DESC, rowid DESC LIMIT 1`,
    [userId, gameDate],
  );
  const mood = row?.mood;
  return typeof mood === 'string' && (MOODS as readonly string[]).includes(mood) ? (mood as MoodValue) : null;
}
