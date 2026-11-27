import {
  ALLOWED_LEAVES,
  ALLOWED_XP,
  XP_DIFFICULTY_THRESHOLDS,
  CUSTOM_UNIT_MAX_LENGTH,
  HABIT_MAX_QUANTITY,
  HABIT_NAME_MAX_LENGTH,
} from '@/config/game';

import { isHabitCategoryId } from './categories';
import type { HabitCategoryId, HabitUnitCode } from './types';

/** Validación de hábitos (RN-HAB-02, RN-HAB-08, RN-HAB-09, INT-04). Funciones puras. */

export const HABIT_UNIT_CODES: readonly HabitUnitCode[] = [
  'MINUTES',
  'PAGES',
  'REPETITIONS',
  'KILOMETERS',
  'GLASSES',
  'TIMES',
];

export function isHabitUnitCode(value: string): value is HabitUnitCode {
  return (HABIT_UNIT_CODES as readonly string[]).includes(value);
}

/** INT-04: Hojas ∈ {0, 5, …, 30}. */
export function isAllowedLeaves(value: number): boolean {
  return (ALLOWED_LEAVES as readonly number[]).includes(value);
}

/** INT-04: XP ∈ {0, 10, …, 50}. */
export function isAllowedXp(value: number): boolean {
  return (ALLOWED_XP as readonly number[]).includes(value);
}

export type HabitDifficulty = 'NONE' | 'EASY' | 'MEDIUM' | 'HARD';

/** RN-HAB-02: la XP se presenta como dificultad (Fácil 10 · Media 20–30 · Difícil 40–50). */
export function difficultyForXp(xp: number): HabitDifficulty {
  if (xp >= XP_DIFFICULTY_THRESHOLDS.hard) return 'HARD';
  if (xp >= XP_DIFFICULTY_THRESHOLDS.medium) return 'MEDIUM';
  if (xp >= XP_DIFFICULTY_THRESHOLDS.easy) return 'EASY';
  return 'NONE';
}

export interface HabitInput {
  name: string;
  categoryId: string;
  targetQuantity: number;
  /** Código de unidad o texto libre ("otra"). */
  unit: string;
  mateLeavesReward: number;
  xpReward: number;
}

export interface NormalizedHabit {
  name: string;
  categoryId: HabitCategoryId;
  targetQuantity: number;
  unit: string;
  mateLeavesReward: number;
  xpReward: number;
}

export type HabitField = 'name' | 'categoryId' | 'targetQuantity' | 'unit' | 'mateLeavesReward' | 'xpReward';

export type HabitValidation =
  | { ok: true; value: NormalizedHabit }
  | { ok: false; errors: Partial<Record<HabitField, string>> };

export function validateHabit(input: HabitInput): HabitValidation {
  const errors: Partial<Record<HabitField, string>> = {};
  const name = input.name.trim();
  const unit = input.unit.trim();

  if (name.length === 0) errors.name = 'Escribe el nombre del hábito.';
  else if (name.length > HABIT_NAME_MAX_LENGTH) {
    errors.name = `El nombre puede tener como máximo ${HABIT_NAME_MAX_LENGTH} caracteres.`;
  }

  if (!isHabitCategoryId(input.categoryId)) errors.categoryId = 'Elige una categoría.'; // RN-HAB-09

  // RN-HAB-08: cantidad entera > 0.
  if (!Number.isInteger(input.targetQuantity) || input.targetQuantity <= 0) {
    errors.targetQuantity = 'La cantidad debe ser un número entero mayor que 0.';
  } else if (input.targetQuantity > HABIT_MAX_QUANTITY) {
    errors.targetQuantity = `La cantidad puede ser como máximo ${HABIT_MAX_QUANTITY}.`;
  }

  if (unit.length === 0) errors.unit = 'Elige o escribe la unidad.';
  else if (!isHabitUnitCode(unit) && unit.length > CUSTOM_UNIT_MAX_LENGTH) {
    errors.unit = `La unidad puede tener como máximo ${CUSTOM_UNIT_MAX_LENGTH} caracteres.`;
  }

  if (!isAllowedLeaves(input.mateLeavesReward)) {
    errors.mateLeavesReward = 'Las Hojas de mate deben ser 0, 5, 10, 15, 20, 25 o 30.';
  }
  if (!isAllowedXp(input.xpReward)) errors.xpReward = 'La XP debe ser 0, 10, 20, 30, 40 o 50.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      categoryId: input.categoryId as HabitCategoryId, // validado arriba
      targetQuantity: input.targetQuantity,
      unit,
      mateLeavesReward: input.mateLeavesReward,
      xpReward: input.xpReward,
    },
  };
}
