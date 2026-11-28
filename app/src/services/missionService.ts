import { isDayClosed } from '@/database/repositories/dailySummariesRepository';
import { listActiveHabits } from '@/database/repositories/habitsRepository';
import {
  countNonAbandonedMissions,
  finishMission,
  findMission,
  insertMission,
} from '@/database/repositories/missionsRepository';
import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import { listUserGoals } from '@/database/repositories/userGoalsRepository';
import { runInTransaction } from '@/database/transaction';
import { DEFAULT_MISSION_SUGGESTIONS } from '@/content/challengeTexts';
import { UNIT_LABELS } from '@/content/habitTexts';
import { challengeSize } from '@/domain/challenges';
import { getGameDate } from '@/domain/gameDay';
import { isHabitUnitCode } from '@/domain/habits';
import {
  canAbandonMission,
  decideAcceptMission,
  decideCompleteMission,
  MISSION_ERROR_MESSAGES,
  type MissionField,
  type MissionInput,
} from '@/domain/missions';
import type { HabitCategoryId } from '@/domain/types';

import type { AppDeps } from './deps';
import { applyRewards } from './ledgerEffects';

/** Misiones secundarias (RN-MIS-01..07). Cada caso de uso es una transacción. */

export interface MissionSuggestion {
  description: string;
  targetQuantity: number;
  unit: string;
}

/**
 * RN-MIS-04: sugiere una misión medible según los hábitos y las metas de la
 * categoría. Prioridad: un hábito activo (una sesión extra de tamaño normal),
 * luego una meta, y si no hay nada, la sugerencia por defecto de la categoría.
 */
export async function suggestMission(
  deps: AppDeps,
  userId: string,
  categoryId: HabitCategoryId,
): Promise<MissionSuggestion> {
  const habit = (await listActiveHabits(deps.db, userId)).find((h) => h.categoryId === categoryId);
  if (habit) {
    const unit = isHabitUnitCode(habit.unit) ? UNIT_LABELS[habit.unit].plural : habit.unit;
    return {
      description: `Sesión extra de ${habit.name}`,
      targetQuantity: challengeSize(habit.targetQuantity, 'NORMAL'),
      unit,
    };
  }
  const fallback = DEFAULT_MISSION_SUGGESTIONS[categoryId];
  const goal = (await listUserGoals(deps.db, userId)).find((g) => g.categoryId === categoryId);
  if (goal) return { ...fallback, description: `${fallback.description} (por tu meta: ${goal.text})` };
  return fallback;
}

export type AcceptMissionResult =
  | { ok: true; missionId: string }
  | { ok: false; error: string; fields?: Partial<Record<MissionField, string>> };

/** Acepta una misión (máximo 3 por jornada sin contar las abandonadas; bloqueada a 0 HP). */
export async function acceptMission(deps: AppDeps, userId: string, input: MissionInput): Promise<AcceptMissionResult> {
  const now = deps.now();
  const gameDate = getGameDate(now);
  return runInTransaction(deps.db, async (): Promise<AcceptMissionResult> => {
    const profile = await getPlayerProfile(deps.db, userId);
    if (!profile) return { ok: false, error: 'No se encontró tu perfil.' };
    const decision = decideAcceptMission({
      input,
      activeOrCompletedToday: await countNonAbandonedMissions(deps.db, userId, gameDate),
      hpHalfUnits: profile.hpHalfUnits,
      dayClosed: await isDayClosed(deps.db, userId, gameDate),
    });
    if (!decision.ok) {
      if (decision.error === 'INVALID') return { ok: false, error: 'Revisa los campos marcados.', fields: decision.fields };
      return { ok: false, error: MISSION_ERROR_MESSAGES[decision.error] };
    }
    const missionId = deps.crypto.randomUUID();
    await insertMission(deps.db, {
      id: missionId,
      userId,
      gameDate,
      ...decision.value,
      mateLeavesReward: decision.reward.leaves,
      xpReward: decision.reward.xp,
      now: now.toISOString(),
    });
    return { ok: true, missionId };
  });
}

export type MissionActionResult = { ok: true } | { ok: false; error: string };

/** RN-MIS-02, RN-MIS-03: +20 Hojas +20 XP una sola vez (`mission-reward:<id>`). */
export async function completeMission(deps: AppDeps, userId: string, missionId: string): Promise<MissionActionResult> {
  const now = deps.now();
  const nowIso = now.toISOString();
  return runInTransaction(deps.db, async (): Promise<MissionActionResult> => {
    const mission = await findMission(deps.db, userId, missionId);
    const profile = await getPlayerProfile(deps.db, userId);
    if (!mission || !profile) return { ok: false, error: 'No se encontró la misión.' };
    const currentGameDate = getGameDate(now);
    const decision = decideCompleteMission({
      mission,
      currentGameDate,
      hpHalfUnits: profile.hpHalfUnits,
      dayClosed: await isDayClosed(deps.db, userId, currentGameDate),
    });
    if (!decision.ok) return { ok: false, error: MISSION_ERROR_MESSAGES[decision.error] };
    if (!(await finishMission(deps.db, { id: mission.id, to: 'COMPLETED', now: nowIso }))) {
      return { ok: false, error: MISSION_ERROR_MESSAGES.NOT_ACCEPTED };
    }
    await applyRewards(deps, {
      profile,
      leavesDelta: decision.effects.leavesDelta,
      xpDelta: decision.effects.xpDelta,
      type: 'MISSION_REWARD',
      sourceType: 'MISSION',
      sourceId: mission.id,
      idempotencyKey: decision.effects.rewardKey,
      nowIso,
    });
    return { ok: true };
  });
}

/** RN-MIS-06: abandonar no cuesta nada y libera el hueco del máximo diario (P-58). */
export async function abandonMission(deps: AppDeps, userId: string, missionId: string): Promise<MissionActionResult> {
  const nowIso = deps.now().toISOString();
  return runInTransaction(deps.db, async (): Promise<MissionActionResult> => {
    const mission = await findMission(deps.db, userId, missionId);
    if (!mission || !canAbandonMission(mission)) return { ok: false, error: MISSION_ERROR_MESSAGES.NOT_ACCEPTED };
    await finishMission(deps.db, { id: mission.id, to: 'ABANDONED', now: nowIso });
    return { ok: true };
  });
}
