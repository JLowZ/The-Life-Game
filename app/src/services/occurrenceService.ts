import { isDayClosed } from '@/database/repositories/dailySummariesRepository';
import { listActiveHabits, listActiveSchedulesForUser } from '@/database/repositories/habitsRepository';
import { insertCurrencyTransaction, insertXpTransaction } from '@/database/repositories/ledgerRepository';
import {
  findOccurrence,
  insertOccurrenceIfAbsent,
  listDailyMissions,
  reopenOccurrence,
  resolveOccurrence,
} from '@/database/repositories/occurrencesRepository';
import { getPlayerProfile, updatePlayerBalances } from '@/database/repositories/playerProfilesRepository';
import { runInTransaction } from '@/database/transaction';
import { getGameDate } from '@/domain/gameDay';
import {
  applyBalanceDeltas,
  decideMark,
  decideUndo,
  MARK_ERROR_MESSAGES,
  type MarkOutcome,
} from '@/domain/habitMarking';
import { isHabitScheduledOn } from '@/domain/schedule';
import type { DailyMission, GameDate } from '@/domain/types';
import { useHabitsStore } from '@/state/useHabitsStore';

import type { AppDeps } from './deps';
import { refreshPlayerProfile } from './profileService';

/**
 * Ocurrencias y marcado (RN-HAB-04, RN-DAY-01..08).
 * Horizonte de 0 días (R-26): solo se crean filas para la jornada actual.
 */

/**
 * Crea las ocurrencias que falten en esa jornada para los hábitos activos
 * programados. Idempotente (INSERT OR IGNORE + UNIQUE(habit_id, game_date)).
 * Debe llamarse DENTRO de una transacción o como paso suelto: no abre una propia.
 */
export async function ensureOccurrencesForDate(deps: AppDeps, userId: string, gameDate: GameDate): Promise<void> {
  const [habits, schedules] = await Promise.all([
    listActiveHabits(deps.db, userId),
    listActiveSchedulesForUser(deps.db, userId, gameDate),
  ]);
  const nowIso = deps.now().toISOString();
  for (const habit of habits) {
    const own = schedules.filter((s) => s.habitId === habit.id);
    if (isHabitScheduledOn(own, gameDate)) {
      await insertOccurrenceIfAbsent(deps.db, { id: deps.crypto.randomUUID(), habit, gameDate, now: nowIso });
    }
  }
}

/** Misiones del día (RN-DAY-08): asegura las ocurrencias de hoy y las devuelve. */
export async function loadToday(
  deps: AppDeps,
  userId: string,
): Promise<{ gameDate: GameDate; occurrences: DailyMission[] }> {
  const gameDate = getGameDate(deps.now());
  await runInTransaction(deps.db, () => ensureOccurrencesForDate(deps, userId, gameDate));
  return { gameDate, occurrences: await listDailyMissions(deps.db, userId, gameDate) };
}

/** Recarga el store de las Misiones del día y el HUD (RN-NAV-03). */
export async function refreshToday(deps: AppDeps, userId: string): Promise<void> {
  const { gameDate, occurrences } = await loadToday(deps, userId);
  useHabitsStore.getState().setToday(gameDate, occurrences);
  await refreshPlayerProfile(deps.db, userId);
}

/** Al cerrar sesión, las Misiones del día no deben mostrar las de la cuenta anterior. */
export function clearToday(): void {
  useHabitsStore.getState().clear();
}

export type MarkResult = { ok: true } | { ok: false; error: string };

/**
 * Marca una ocurrencia como cumplida o incumplida (RN-DAY-03). Cumplida:
 * +Hojas y +XP UNA vez (RN-DAY-05, INT-01). Todo en una transacción: la
 * ocurrencia, los movimientos y los saldos cambian juntos o no cambia nada.
 */
export async function markOccurrence(
  deps: AppDeps,
  userId: string,
  occurrenceId: string,
  outcome: MarkOutcome,
): Promise<MarkResult> {
  const now = deps.now();
  const nowIso = now.toISOString();
  const currentGameDate = getGameDate(now);

  return runInTransaction(deps.db, async (): Promise<MarkResult> => {
    const occurrence = await findOccurrence(deps.db, userId, occurrenceId);
    const profile = await getPlayerProfile(deps.db, userId);
    if (!occurrence || !profile) return { ok: false, error: 'No se encontró el hábito.' };

    const decision = decideMark({
      occurrence,
      outcome,
      currentGameDate,
      dayClosed: await isDayClosed(deps.db, userId, occurrence.gameDate),
      hpHalfUnits: profile.hpHalfUnits,
    });
    if (!decision.ok) return { ok: false, error: MARK_ERROR_MESSAGES[decision.error] };
    const { effects } = decision;

    const resolved = await resolveOccurrence(deps.db, {
      id: occurrence.id,
      status: effects.status,
      expectedSeq: occurrence.resolutionSeq,
      resolutionSeq: effects.resolutionSeq,
      now: nowIso,
    });
    if (!resolved) return { ok: false, error: MARK_ERROR_MESSAGES.ALREADY_RESOLVED };

    if (effects.rewardKey) {
      const balances = applyBalanceDeltas(profile, effects.leavesDelta, effects.xpDelta);
      const source = { userId, type: 'HABIT_REWARD' as const, sourceType: 'OCCURRENCE', sourceId: occurrence.id };
      if (effects.leavesDelta !== 0) {
        await insertCurrencyTransaction(deps.db, {
          ...source,
          id: deps.crypto.randomUUID(),
          amount: effects.leavesDelta,
          idempotencyKey: effects.rewardKey,
          balanceAfter: balances.mateLeavesBalance,
          now: nowIso,
        });
      }
      if (effects.xpDelta !== 0) {
        await insertXpTransaction(deps.db, {
          ...source,
          id: deps.crypto.randomUUID(),
          amount: effects.xpDelta,
          idempotencyKey: effects.rewardKey,
          xpTotalAfter: balances.xpTotal,
          now: nowIso,
        });
      }
      await updatePlayerBalances(deps.db, { userId, ...balances, now: nowIso });
    }
    return { ok: true };
  });
}

/**
 * Deshacer en 10 s (RN-DAY-07): vuelve a PENDING y, si se acreditó, inserta
 * movimientos compensatorios (UNDO_REVERSAL). No borra ningún movimiento.
 */
export async function undoMark(deps: AppDeps, userId: string, occurrenceId: string): Promise<MarkResult> {
  const now = deps.now();
  const nowIso = now.toISOString();

  return runInTransaction(deps.db, async (): Promise<MarkResult> => {
    const occurrence = await findOccurrence(deps.db, userId, occurrenceId);
    const profile = await getPlayerProfile(deps.db, userId);
    if (!occurrence || !profile) return { ok: false, error: 'No se encontró el hábito.' };

    const decision = decideUndo({
      occurrence,
      now,
      currentGameDate: getGameDate(now),
      dayClosed: await isDayClosed(deps.db, userId, occurrence.gameDate),
      mateLeavesBalance: profile.mateLeavesBalance,
    });
    if (!decision.ok) return { ok: false, error: MARK_ERROR_MESSAGES[decision.error] };
    const { effects } = decision;

    const reopened = await reopenOccurrence(deps.db, {
      id: occurrence.id,
      expectedSeq: occurrence.resolutionSeq,
      now: nowIso,
    });
    if (!reopened) return { ok: false, error: MARK_ERROR_MESSAGES.NOT_RESOLVED };

    if (effects.reversalKey) {
      const balances = applyBalanceDeltas(profile, effects.leavesDelta, effects.xpDelta);
      const source = { userId, type: 'UNDO_REVERSAL' as const, sourceType: 'OCCURRENCE', sourceId: occurrence.id };
      if (effects.leavesDelta !== 0) {
        await insertCurrencyTransaction(deps.db, {
          ...source,
          id: deps.crypto.randomUUID(),
          amount: effects.leavesDelta,
          idempotencyKey: effects.reversalKey,
          balanceAfter: balances.mateLeavesBalance,
          now: nowIso,
        });
      }
      if (effects.xpDelta !== 0) {
        await insertXpTransaction(deps.db, {
          ...source,
          id: deps.crypto.randomUUID(),
          amount: effects.xpDelta,
          idempotencyKey: effects.reversalKey,
          xpTotalAfter: balances.xpTotal,
          now: nowIso,
        });
      }
      await updatePlayerBalances(deps.db, { userId, ...balances, now: nowIso });
    }
    return { ok: true };
  });
}
