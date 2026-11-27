import { findUserById } from '@/database/repositories/usersRepository';
import { listUserGoals } from '@/database/repositories/userGoalsRepository';

import { registerUser, restoreSession } from './authService';
import { completeOnboarding, listHabitCategories } from './onboardingService';
import { TEST_NOW, createTestDeps } from './testing/createTestDeps';

const ANA = { username: 'Ana_92', email: 'ana@example.com', password: 'secreto1', privacyAccepted: true };
const INPUT = {
  purpose: 'Ser más constante',
  goals: [
    { text: 'Leer 12 libros', categoryId: 'READING' },
    { text: 'Correr 5 km', categoryId: 'EXERCISE' },
  ],
};

/**
 * Cuenta registrada SIN terminar el onboarding. Con R-34 ya no se crean así,
 * pero pueden existir de antes (datos de prueba de la Fase 4): completeOnboarding
 * sigue sirviendo para ellas.
 */
async function setup() {
  const deps = await createTestDeps();
  const result = await registerUser(deps, ANA, { purpose: 'temporal', goals: [{ text: 'x', categoryId: 'ART' }] });
  if (!result.ok) throw new Error('registro fallido');
  const userId = result.user.id;
  await deps.db.runAsync('DELETE FROM user_goals WHERE user_id = ?', [userId]);
  await deps.db.runAsync('UPDATE users SET purpose = NULL, onboarding_completed_at = NULL WHERE id = ?', [userId]);
  return { deps, userId };
}

describe('completeOnboarding (cuentas antiguas sin onboarding)', () => {
  it('guarda el propósito, las metas en orden y marca el onboarding como terminado', async () => {
    const { deps, userId } = await setup();
    const result = await completeOnboarding(deps, userId, INPUT);
    expect(result).toEqual({ ok: true, user: { id: userId, username: 'Ana_92', onboardingCompleted: true } });

    const user = await findUserById(deps.db, userId);
    expect(user?.purpose).toBe('Ser más constante');
    expect(user?.onboardingCompletedAt).toBe(TEST_NOW.toISOString());
    const goals = await listUserGoals(deps.db, userId);
    expect(goals.map((g) => [g.text, g.categoryId, g.sortOrder])).toEqual([
      ['Leer 12 libros', 'READING', 0],
      ['Correr 5 km', 'EXERCISE', 1],
    ]);
    expect((await restoreSession(deps))?.onboardingCompleted).toBe(true);
  });

  it('idempotente: ejecutarlo dos veces no duplica las metas', async () => {
    const { deps, userId } = await setup();
    await completeOnboarding(deps, userId, INPUT);
    const second = await completeOnboarding(deps, userId, INPUT);
    expect(second.ok).toBe(true);
    expect(await listUserGoals(deps.db, userId)).toHaveLength(2);
  });

  it('una entrada inválida no guarda nada', async () => {
    const { deps, userId } = await setup();
    const result = await completeOnboarding(deps, userId, { purpose: '', goals: [] });
    expect(result.ok).toBe(false);
    expect((await findUserById(deps.db, userId))?.onboardingCompletedAt).toBeNull();
    expect(await listUserGoals(deps.db, userId)).toHaveLength(0);
  });

  it('ofrece las 17 categorías para las metas (P-42 + P-59)', async () => {
    const { deps } = await setup();
    expect(await listHabitCategories(deps.db)).toHaveLength(17);
  });
});
