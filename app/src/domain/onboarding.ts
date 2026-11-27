import { GOAL_TEXT_MAX_LENGTH, MIN_ONBOARDING_GOALS, PURPOSE_MAX_LENGTH } from '@/config/game';

import { isHabitCategoryId } from './categories';
import type { HabitCategoryId } from './types';

/**
 * Validación del onboarding (RN-AUTH-02, RN-AUTH-06): propósito personal y
 * metas (texto libre + categoría). Función pura.
 */

export interface GoalDraft {
  text: string;
  categoryId: string;
}

export interface OnboardingInput {
  purpose: string;
  goals: GoalDraft[];
}

export interface NormalizedOnboarding {
  purpose: string;
  goals: { text: string; categoryId: HabitCategoryId }[];
}

export type OnboardingField = 'purpose' | 'goals';

export type OnboardingValidation =
  | { ok: true; value: NormalizedOnboarding }
  | { ok: false; errors: Partial<Record<OnboardingField, string>> };

export function validatePurpose(purpose: string): string | null {
  const text = purpose.trim();
  if (text.length === 0) return 'Escribe tu propósito personal.';
  if (text.length > PURPOSE_MAX_LENGTH) {
    return `El propósito puede tener como máximo ${PURPOSE_MAX_LENGTH} caracteres.`;
  }
  return null;
}

/** Valida una meta suelta antes de añadirla a la lista. */
export function validateGoal(goal: GoalDraft): string | null {
  const text = goal.text.trim();
  if (text.length === 0) return 'Escribe la meta.';
  if (text.length > GOAL_TEXT_MAX_LENGTH) {
    return `La meta puede tener como máximo ${GOAL_TEXT_MAX_LENGTH} caracteres.`;
  }
  if (!isHabitCategoryId(goal.categoryId)) return 'Elige una categoría para la meta.';
  return null;
}

export function validateOnboarding(input: OnboardingInput): OnboardingValidation {
  const errors: Partial<Record<OnboardingField, string>> = {};

  const purposeError = validatePurpose(input.purpose);
  if (purposeError) errors.purpose = purposeError;

  if (input.goals.length < MIN_ONBOARDING_GOALS) {
    errors.goals = 'Añade al menos una meta.';
  } else {
    const goalError = input.goals.map(validateGoal).find((error) => error !== null);
    if (goalError) errors.goals = goalError;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      purpose: input.purpose.trim(),
      goals: input.goals.map((goal) => ({
        text: goal.text.trim(),
        // Ya validado arriba: es un HabitCategoryId.
        categoryId: goal.categoryId as HabitCategoryId,
      })),
    },
  };
}
