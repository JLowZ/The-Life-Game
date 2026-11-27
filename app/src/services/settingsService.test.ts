import { findUserById } from '@/database/repositories/usersRepository';

import { registerUser, signIn, signOut } from './authService';
import { changeUsername, loadUserGoals, updateGoal } from './settingsService';
import { createTestDeps } from './testing/createTestDeps';

const ONBOARDING = { purpose: 'Ser constante', goals: [{ text: 'Leer 12 libros', categoryId: 'READING' }] };

async function setup() {
  const deps = await createTestDeps();
  const ana = await registerUser(
    deps,
    { username: 'Ana_92', email: 'ana@example.com', password: 'secreto1', privacyAccepted: true },
    ONBOARDING,
  );
  const beto = await registerUser(
    deps,
    { username: 'Beto', email: 'beto@example.com', password: 'secreto1', privacyAccepted: true },
    ONBOARDING,
  );
  if (!ana.ok || !beto.ok) throw new Error('registro fallido');
  return { deps, anaId: ana.user.id };
}

describe('changeUsername (Ajustes, R-31)', () => {
  it('cambia el nombre y se puede iniciar sesión con el nuevo', async () => {
    const { deps, anaId } = await setup();
    expect(await changeUsername(deps, anaId, ' Ana.Nueva ')).toEqual({ ok: true, value: 'Ana.Nueva' });
    const user = await findUserById(deps.db, anaId);
    expect(user?.username).toBe('Ana.Nueva');
    expect(user?.usernameNormalized).toBe('ana.nueva');
    await signOut(deps);
    expect((await signIn(deps, { identifier: 'ANA.NUEVA', password: 'secreto1' })).ok).toBe(true);
  });

  it('rechaza un nombre que ya usa otra persona (sin distinguir mayúsculas)', async () => {
    const { deps, anaId } = await setup();
    expect(await changeUsername(deps, anaId, 'BETO')).toEqual({
      ok: false,
      error: 'Ese nombre de usuario ya existe.',
    });
    expect((await findUserById(deps.db, anaId))?.username).toBe('Ana_92');
  });

  it('permite cambiar solo las mayúsculas del propio nombre, también dos veces', async () => {
    const { deps, anaId } = await setup();
    expect((await changeUsername(deps, anaId, 'ANA_92')).ok).toBe(true);
    expect((await changeUsername(deps, anaId, 'ANA_92')).ok).toBe(true);
    expect((await findUserById(deps.db, anaId))?.username).toBe('ANA_92');
  });

  it('aplica el formato R-31 (límites 2 y 3 caracteres, sin @)', async () => {
    const { deps, anaId } = await setup();
    expect((await changeUsername(deps, anaId, 'ab')).ok).toBe(false);
    expect((await changeUsername(deps, anaId, 'a@b')).ok).toBe(false);
    expect((await changeUsername(deps, anaId, 'abc')).ok).toBe(true);
  });
});

describe('updateGoal (Ajustes)', () => {
  it('cambia el texto y la categoría de la meta, incluida la nueva categoría general (P-59)', async () => {
    const { deps, anaId } = await setup();
    const [goal] = await loadUserGoals(deps.db, anaId);
    if (!goal) throw new Error('sin metas');
    const result = await updateGoal(deps, anaId, goal.id, {
      text: ' Crecer cada día ',
      categoryId: 'PERSONAL_DEVELOPMENT',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((g) => [g.text, g.categoryId])).toEqual([['Crecer cada día', 'PERSONAL_DEVELOPMENT']]);
    }
  });

  it('rechaza texto vacío o categoría inválida, y no deja editar metas de otra cuenta', async () => {
    const { deps, anaId } = await setup();
    const [goal] = await loadUserGoals(deps.db, anaId);
    if (!goal) throw new Error('sin metas');
    expect((await updateGoal(deps, anaId, goal.id, { text: '  ', categoryId: 'READING' })).ok).toBe(false);
    expect((await updateGoal(deps, anaId, goal.id, { text: 'Algo', categoryId: 'GAMING' })).ok).toBe(false);
    expect(await updateGoal(deps, 'otra-cuenta', goal.id, { text: 'Algo', categoryId: 'ART' })).toEqual({
      ok: false,
      error: 'No se encontró la meta.',
    });
    expect((await loadUserGoals(deps.db, anaId))[0]?.text).toBe('Leer 12 libros');
  });
});
