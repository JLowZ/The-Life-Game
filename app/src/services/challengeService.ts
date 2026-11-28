import {
  applyGrace,
  cancelActiveSuperChallenge,
  findChallenge,
  insertMissedHabitChallenge,
  insertRecoveryChallenge,
  listActiveChallenges,
  listOverdueChallenges,
  transitionChallenge,
} from '@/database/repositories/challengesRepository';
import { listMissionsForDate } from '@/database/repositories/missionsRepository';
import { getLastMood } from '@/database/repositories/moodRepository';
import { findOccurrence } from '@/database/repositories/occurrencesRepository';
import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import { runInTransaction } from '@/database/transaction';
import { challengeTitle } from '@/content/challengeTexts';
import {
  CHALLENGE_ERROR_MESSAGES,
  challengeDeadline,
  challengeRewards,
  challengeSize,
  decideCompleteChallenge,
  decideExpiry,
  decideGrace,
  variantForMood,
} from '@/domain/challenges';
import { getGameDate } from '@/domain/gameDay';
import type { Challenge, HabitOccurrence } from '@/domain/types';
import { useChallengesStore } from '@/state/useChallengesStore';

import type { AppDeps } from './deps';
import { applyHpChange, applyRewards } from './ledgerEffects';
import { refreshPlayerProfile } from './profileService';

/**
 * Desafíos (RN-DES-xx, RN-HP-03..10). Cada caso de uso es UNA transacción,
 * salvo `createMissedHabitChallenge`, que se llama dentro de la del marcado.
 */

/**
 * RN-DAY-06, RN-DES-03, RN-DES-10: crea EL desafío de una ocurrencia incumplida.
 * Variante según el último ánimo de su jornada (sin ánimo: normal). Plazo 72 h.
 * Debe llamarse DENTRO de una transacción. UNIQUE(source_occurrence_id) = INT-06.
 */
export async function createMissedHabitChallenge(
  deps: AppDeps,
  occurrence: HabitOccurrence,
  createdAt: Date,
): Promise<void> {
  const variant = variantForMood(await getLastMood(deps.db, occurrence.userId, occurrence.gameDate));
  const size = challengeSize(occurrence.targetQuantity, variant);
  const rewards = challengeRewards(occurrence.mateLeavesReward, occurrence.xpReward);
  await insertMissedHabitChallenge(deps.db, {
    id: deps.crypto.randomUUID(),
    userId: occurrence.userId,
    habitId: occurrence.habitId,
    variant,
    sourceOccurrenceId: occurrence.id,
    sourceGameDate: occurrence.gameDate,
    title: challengeTitle(occurrence.habitName, size, occurrence.unit),
    targetQuantity: size,
    unit: occurrence.unit,
    deadlineAt: challengeDeadline(createdAt).toISOString(),
    mateLeavesReward: rewards.leaves,
    xpReward: rewards.xp,
    now: createdAt.toISOString(),
  });
}

export type ChallengeActionResult = { ok: true } | { ok: false; error: string };

/**
 * Autodeclaración (RN-DES-12): el usuario confirma que cumplió el criterio.
 * Por incumplimiento o recuperación: +½ Hojas +20 % XP (RN-DES-06).
 * Recuperación: +1 unidad (RN-HP-06). A 0 HP: +1 unidad y cancela el Superdesafío (RN-HP-10).
 * No cambia la ocurrencia ni el porcentaje del día.
 */
export async function completeChallenge(
  deps: AppDeps,
  userId: string,
  challengeId: string,
): Promise<ChallengeActionResult> {
  const now = deps.now();
  const nowIso = now.toISOString();
  return runInTransaction(deps.db, async (): Promise<ChallengeActionResult> => {
    const challenge = await findChallenge(deps.db, userId, challengeId);
    let profile = await getPlayerProfile(deps.db, userId);
    if (!challenge || !profile) return { ok: false, error: 'No se encontró el desafío.' };

    const decision = decideCompleteChallenge({ challenge, now, hpHalfUnits: profile.hpHalfUnits });
    if (!decision.ok) return { ok: false, error: CHALLENGE_ERROR_MESSAGES[decision.error] };
    const { effects } = decision;

    const moved = await transitionChallenge(deps.db, { id: challenge.id, expected: ['PENDING'], to: 'COMPLETED', now: nowIso });
    if (!moved) return { ok: false, error: CHALLENGE_ERROR_MESSAGES.NOT_PENDING };

    profile = await applyRewards(deps, {
      profile,
      leavesDelta: effects.leavesDelta,
      xpDelta: effects.xpDelta,
      type: 'CHALLENGE_REWARD',
      sourceType: 'CHALLENGE',
      sourceId: challenge.id,
      idempotencyKey: effects.rewardKey,
      nowIso,
    });
    if (effects.hpDelta > 0 && effects.hpReason && effects.hpKey) {
      await applyHpChange(deps, {
        profile,
        deltaRequested: effects.hpDelta,
        reason: effects.hpReason,
        sourceType: 'CHALLENGE',
        sourceId: challenge.id,
        idempotencyKey: effects.hpKey,
        nowIso,
      });
    }
    if (effects.cancelSuper) await cancelActiveSuperChallenge(deps.db, userId, nowIso);
    return { ok: true };
  });
}

/**
 * Reconciliación de desafíos (ARCHITECTURE.md §8, pasos 2 y 3). Idempotente.
 * 1. Gracia (solo si la app se acaba de abrir): vencidos con la app cerrada
 *    reciben 12 h más, una sola vez (INT-18).
 * 2. Vencimiento: −1 unidad por desafío (`hp-penalty:<occurrenceId>`, INT-02)
 *    y un desafío de recuperación por cada vida perdida de verdad (RN-HP-06).
 */
export async function reconcileChallenges(
  deps: AppDeps,
  userId: string,
  options: { appOpened: boolean },
): Promise<{ graced: number; expired: number }> {
  const now = deps.now();
  const nowIso = now.toISOString();
  return runInTransaction(deps.db, async () => {
    let graced = 0;
    let expired = 0;
    let profile = await getPlayerProfile(deps.db, userId);
    if (!profile) return { graced, expired };

    for (const challenge of await listOverdueChallenges(deps.db, userId, nowIso)) {
      if (options.appOpened) {
        const newDeadline = decideGrace(challenge, now);
        if (newDeadline && (await applyGrace(deps.db, { id: challenge.id, deadlineAt: newDeadline.toISOString(), now: nowIso }))) {
          graced += 1;
          continue;
        }
      }
      const expiry = decideExpiry(challenge, now, profile.hpHalfUnits);
      if (!expiry || challenge.sourceOccurrenceId === null) continue;
      const moved = await transitionChallenge(deps.db, {
        id: challenge.id,
        expected: ['PENDING', 'DECLINED'],
        to: 'EXPIRED',
        now: nowIso,
      });
      if (!moved) continue;
      expired += 1;

      const penalty = await applyHpChange(deps, {
        profile,
        deltaRequested: expiry.deltaRequested,
        reason: 'MISSED_HABIT_PENALTY',
        sourceType: 'CHALLENGE',
        sourceId: challenge.id,
        idempotencyKey: expiry.penaltyKey,
        nowIso,
      });
      profile = penalty.profile;
      if (penalty.deltaApplied < 0) {
        const occurrence = await findOccurrence(deps.db, userId, challenge.sourceOccurrenceId);
        if (occurrence) await createRecoveryChallenge(deps, occurrence, penalty.entryId, nowIso);
      }
    }
    return { graced, expired };
  });
}

/** RN-HP-06: recuperación del mismo hábito, tamaño normal, sin plazo, misma recompensa. */
async function createRecoveryChallenge(
  deps: AppDeps,
  occurrence: HabitOccurrence,
  penaltyId: string,
  nowIso: string,
): Promise<void> {
  const size = challengeSize(occurrence.targetQuantity, 'NORMAL');
  const rewards = challengeRewards(occurrence.mateLeavesReward, occurrence.xpReward);
  await insertRecoveryChallenge(deps.db, {
    id: deps.crypto.randomUUID(),
    userId: occurrence.userId,
    habitId: occurrence.habitId,
    sourcePenaltyId: penaltyId,
    title: challengeTitle(occurrence.habitName, size, occurrence.unit),
    targetQuantity: size,
    unit: occurrence.unit,
    mateLeavesReward: rewards.leaves,
    xpReward: rewards.xp,
    now: nowIso,
  });
}

export async function listChallenges(deps: AppDeps, userId: string): Promise<Challenge[]> {
  return listActiveChallenges(deps.db, userId);
}

/** Recarga los desafíos activos, las misiones de hoy y el HUD (RN-NAV-03). */
export async function refreshChallenges(deps: AppDeps, userId: string): Promise<void> {
  const gameDate = getGameDate(deps.now());
  const [active, missions] = await Promise.all([
    listActiveChallenges(deps.db, userId),
    listMissionsForDate(deps.db, userId, gameDate),
  ]);
  useChallengesStore.getState().setChallenges(active, missions);
  await refreshPlayerProfile(deps.db, userId);
}

/** Al cerrar sesión, no mostrar los desafíos de la cuenta anterior. */
export function clearChallenges(): void {
  useChallengesStore.getState().clear();
}
