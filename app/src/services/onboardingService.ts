import { listCategories } from '@/database/repositories/categoriesRepository';
import { completeUserOnboarding, findUserById } from '@/database/repositories/usersRepository';
import { insertUserGoal } from '@/database/repositories/userGoalsRepository';
import { runInTransaction } from '@/database/transaction';
import type { SqlDatabase } from '@/database/types';
import { validateOnboarding, type OnboardingField, type OnboardingInput } from '@/domain/onboarding';
import type { HabitCategory } from '@/domain/types';

import type { SessionUser } from './authService';
import type { AppDeps } from './deps';

export type OnboardingResult =
  | { ok: true; user: SessionUser }
  | { ok: false; errors: Partial<Record<OnboardingField, string>> };

/** Catálogo de categorías para elegir la de cada meta (P-42). */
export function listHabitCategories(db: SqlDatabase): Promise<HabitCategory[]> {
  return listCategories(db);
}

/**
 * Termina el onboarding (RN-AUTH-02): guarda el propósito y las metas y marca
 * `onboarding_completed_at`, todo en UNA transacción.
 * Idempotente: si ya estaba terminado, no vuelve a insertar las metas.
 */
export async function completeOnboarding(
  deps: AppDeps,
  userId: string,
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const validation = validateOnboarding(input);
  if (!validation.ok) return validation;
  const { purpose, goals } = validation.value;
  const now = deps.now().toISOString();

  return runInTransaction(deps.db, async (): Promise<OnboardingResult> => {
    const user = await findUserById(deps.db, userId);
    if (!user) throw new Error('La sesión no corresponde a ningún usuario.');

    const updated = await completeUserOnboarding(deps.db, { userId, purpose, now });
    if (updated) {
      for (const [index, goal] of goals.entries()) {
        await insertUserGoal(deps.db, {
          id: deps.crypto.randomUUID(),
          userId,
          text: goal.text,
          categoryId: goal.categoryId,
          sortOrder: index,
          now,
        });
      }
    }
    return { ok: true, user: { id: user.id, username: user.username, onboardingCompleted: true } };
  });
}
