import {
  HABIT_MAX_QUANTITY,
  MAX_DAILY_MISSIONS,
  MISSION_DESCRIPTION_MAX_LENGTH,
  MISSION_REWARD,
} from '@/config/game';

import { isHabitCategoryId } from './categories';
import type { GameDate, HabitCategoryId, HpHalfUnits, UserMission } from './types';

/** Misiones secundarias (RN-MIS-01..07, INT-20). Funciones puras. */

export interface MissionInput {
  categoryId: string;
  description: string;
  targetQuantity: number;
  unit: string;
}

export type MissionField = 'categoryId' | 'description' | 'targetQuantity' | 'unit';

export type AcceptMissionDecision =
  | {
      ok: true;
      value: { categoryId: HabitCategoryId; description: string; targetQuantity: number; unit: string };
      reward: { leaves: number; xp: number };
    }
  | { ok: false; error: 'ZERO_HP' | 'DAILY_LIMIT' }
  | { ok: false; error: 'INVALID'; fields: Partial<Record<MissionField, string>> };

/**
 * RN-MIS-04: máximo 3 por jornada sin contar las abandonadas (P-58).
 * RN-MIS-05: bloqueadas a 0 HP.
 */
export function decideAcceptMission(context: {
  input: MissionInput;
  /** Misiones de hoy que NO están abandonadas. */
  activeOrCompletedToday: number;
  hpHalfUnits: HpHalfUnits;
}): AcceptMissionDecision {
  if (context.hpHalfUnits <= 0) return { ok: false, error: 'ZERO_HP' };
  if (context.activeOrCompletedToday >= MAX_DAILY_MISSIONS) return { ok: false, error: 'DAILY_LIMIT' };

  const { input } = context;
  const fields: Partial<Record<MissionField, string>> = {};
  const description = input.description.trim();
  const unit = input.unit.trim();
  if (!isHabitCategoryId(input.categoryId)) fields.categoryId = 'Elige una categoría.';
  if (description.length === 0) fields.description = 'Describe la misión.';
  else if (description.length > MISSION_DESCRIPTION_MAX_LENGTH) {
    fields.description = `Máximo ${MISSION_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }
  if (!Number.isInteger(input.targetQuantity) || input.targetQuantity <= 0 || input.targetQuantity > HABIT_MAX_QUANTITY) {
    fields.targetQuantity = 'La cantidad debe ser un número entero mayor que 0.';
  }
  if (unit.length === 0) fields.unit = 'Escribe la unidad.';
  if (Object.keys(fields).length > 0) return { ok: false, error: 'INVALID', fields };

  return {
    ok: true,
    value: {
      categoryId: input.categoryId as HabitCategoryId, // validado arriba
      description,
      targetQuantity: input.targetQuantity,
      unit,
    },
    reward: { leaves: MISSION_REWARD.leaves, xp: MISSION_REWARD.xp }, // RN-MIS-02: se copia al aceptar
  };
}

export type MissionActionError = 'NOT_ACCEPTED' | 'DAY_CLOSED' | 'ZERO_HP';

/** RN-MIS-03: la recompensa se acredita una sola vez (mission-reward:<id>). */
export function decideCompleteMission(context: {
  mission: UserMission;
  currentGameDate: GameDate;
  hpHalfUnits: HpHalfUnits;
}):
  | { ok: true; effects: { leavesDelta: number; xpDelta: number; rewardKey: string } }
  | { ok: false; error: MissionActionError } {
  const { mission } = context;
  if (mission.status !== 'ACCEPTED') return { ok: false, error: 'NOT_ACCEPTED' };
  if (mission.gameDate !== context.currentGameDate) return { ok: false, error: 'DAY_CLOSED' };
  if (context.hpHalfUnits <= 0) return { ok: false, error: 'ZERO_HP' };
  return {
    ok: true,
    effects: {
      leavesDelta: mission.mateLeavesReward,
      xpDelta: mission.xpReward,
      rewardKey: `mission-reward:${mission.id}`,
    },
  };
}

/** RN-MIS-06: abandonar no cuesta nada. Solo una misión aceptada. */
export function canAbandonMission(mission: UserMission): boolean {
  return mission.status === 'ACCEPTED';
}

export const MISSION_ERROR_MESSAGES: Record<'ZERO_HP' | 'DAILY_LIMIT' | MissionActionError, string> = {
  ZERO_HP: 'Sin vidas no puedes hacer misiones secundarias. Completa un desafío de recuperación.',
  DAILY_LIMIT: `Ya tienes ${MAX_DAILY_MISSIONS} misiones secundarias hoy. ¡Vuelve mañana!`,
  NOT_ACCEPTED: 'Esta misión ya no está activa.',
  DAY_CLOSED: 'Esta misión era de una jornada que ya terminó.',
};
