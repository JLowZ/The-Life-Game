import { findUserByUsernameNormalized, updateUsername } from '@/database/repositories/usersRepository';
import { listUserGoals, updateUserGoal } from '@/database/repositories/userGoalsRepository';
import { runInTransaction } from '@/database/transaction';
import type { SqlDatabase } from '@/database/types';
import { normalizeUsername, validateUsername } from '@/domain/auth';
import { validateGoal, type GoalDraft } from '@/domain/onboarding';
import type { HabitCategoryId, UserGoal } from '@/domain/types';

import type { AppDeps } from './deps';

/** Casos de uso de la pantalla Ajustes. */

export type SettingsResult<T> = { ok: true; value: T } | { ok: false; error: string };

const USERNAME_TAKEN = 'Ese nombre de usuario ya existe.';

/** Cambia el nombre de usuario (R-31; unicidad sin distinguir mayúsculas, RN-AUTH-02). */
export async function changeUsername(
  deps: AppDeps,
  userId: string,
  newUsername: string,
): Promise<SettingsResult<string>> {
  const error = validateUsername(newUsername);
  if (error) return { ok: false, error };
  const username = newUsername.trim();
  const usernameNormalized = normalizeUsername(username);

  return runInTransaction(deps.db, async (): Promise<SettingsResult<string>> => {
    const owner = await findUserByUsernameNormalized(deps.db, usernameNormalized);
    // Si es el mismo usuario, puede cambiar solo mayúsculas ("ana" → "Ana").
    if (owner && owner.id !== userId) return { ok: false, error: USERNAME_TAKEN };
    const updated = await updateUsername(deps.db, {
      userId,
      username,
      usernameNormalized,
      now: deps.now().toISOString(),
    });
    if (!updated) throw new Error('La sesión no corresponde a ningún usuario.');
    return { ok: true, value: username };
  });
}

export function loadUserGoals(db: SqlDatabase, userId: string): Promise<UserGoal[]> {
  return listUserGoals(db, userId);
}

/** Edita el texto y la categoría de una meta (los mismos límites que el onboarding, R-32). */
export async function updateGoal(
  deps: AppDeps,
  userId: string,
  goalId: string,
  input: GoalDraft,
): Promise<SettingsResult<UserGoal[]>> {
  const error = validateGoal(input);
  if (error) return { ok: false, error };

  return runInTransaction(deps.db, async (): Promise<SettingsResult<UserGoal[]>> => {
    const updated = await updateUserGoal(deps.db, {
      id: goalId,
      userId,
      text: input.text.trim(),
      // validateGoal ya comprobó que es una categoría válida.
      categoryId: input.categoryId as HabitCategoryId,
      now: deps.now().toISOString(),
    });
    if (!updated) return { ok: false, error: 'No se encontró la meta.' };
    return { ok: true, value: await listUserGoals(deps.db, userId) };
  });
}
