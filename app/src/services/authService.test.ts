import { findUserById } from '@/database/repositories/usersRepository';
import type { SqlDatabase } from '@/database/types';

import { listUserGoals } from '@/database/repositories/userGoalsRepository';

import {
  PASSWORD_ALGO,
  checkAccountAvailability,
  registerUser as registerWithOnboarding,
  restoreSession,
  signIn,
  signOut,
} from './authService';
import { loadPlayerProfile } from './profileService';
import { createTestDeps } from './testing/createTestDeps';

const ANA = { username: 'Ana_92', email: 'Ana@Example.com', password: 'secreto1', privacyAccepted: true };
const ONBOARDING = { purpose: 'Ser más constante', goals: [{ text: 'Leer 12 libros', categoryId: 'READING' }] };

type Deps = Awaited<ReturnType<typeof createTestDeps>>;
/** Registro completo (cuenta + onboarding), como al pulsar "Comenzar". */
function registerUser(deps: Deps, account: typeof ANA) {
  return registerWithOnboarding(deps, account, ONBOARDING);
}

async function countRows(db: SqlDatabase, table: 'users' | 'player_profiles'): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM ${table}`, []);
  return row?.total ?? 0;
}

describe('registerUser', () => {
  it('RN-AUTH-03: crea la cuenta con el perfil inicial (20 unidades, 0 Hojas, 0 XP, nivel 0) y abre sesión', async () => {
    const deps = await createTestDeps();
    const result = await registerUser(deps, ANA);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user).toEqual({ id: expect.any(String), username: 'Ana_92', onboardingCompleted: true });
    expect(await loadPlayerProfile(deps.db, result.user.id)).toEqual({
      userId: result.user.id,
      level: 0,
      xpTotal: 0,
      mateLeavesBalance: 0,
      hpHalfUnits: 20,
      perfectStreak: 0,
    });
    expect(deps.session.current).toBe(result.user.id);
  });

  it('RN-AUTH-05: la contraseña no se guarda en claro (hash + sal)', async () => {
    const deps = await createTestDeps();
    const result = await registerUser(deps, ANA);
    if (!result.ok) throw new Error('registro fallido');
    const user = await findUserById(deps.db, result.user.id);
    expect(user?.passwordAlgo).toBe(PASSWORD_ALGO);
    expect(user?.passwordHash).toMatch(/^[0-9a-f]{64}$/);
    expect(user?.passwordHash).not.toContain(ANA.password);
    expect(user?.passwordSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(user?.email).toBe('ana@example.com');
  });

  it('dos usuarios con la misma contraseña tienen hashes distintos (sal aleatoria)', async () => {
    const deps = await createTestDeps();
    const a = await registerUser(deps, ANA);
    const b = await registerUser(deps, { ...ANA, username: 'Beto', email: 'beto@example.com' });
    if (!a.ok || !b.ok) throw new Error('registro fallido');
    const [ua, ub] = [await findUserById(deps.db, a.user.id), await findUserById(deps.db, b.user.id)];
    expect(ua?.passwordHash).not.toBe(ub?.passwordHash);
  });

  it('RN-AUTH-02: usuario repetido sin distinguir mayúsculas y correo repetido → error; un solo registro (dos veces)', async () => {
    const deps = await createTestDeps();
    await registerUser(deps, ANA);
    const repeated = await registerUser(deps, { ...ANA, username: 'ANA_92', email: 'ANA@example.com' });
    expect(repeated).toEqual({
      ok: false,
      errors: { username: 'Ese nombre de usuario ya existe.', email: 'Ese correo ya está registrado.' },
    });
    expect(await countRows(deps.db, 'users')).toBe(1);
    expect(await countRows(deps.db, 'player_profiles')).toBe(1);
  });

  it('R-34: guarda el propósito y las metas en la misma transacción que la cuenta', async () => {
    const deps = await createTestDeps();
    const result = await registerUser(deps, ANA);
    if (!result.ok) throw new Error('registro fallido');
    const user = await findUserById(deps.db, result.user.id);
    expect(user?.purpose).toBe('Ser más constante');
    expect(user?.onboardingCompletedAt).not.toBeNull();
    expect((await listUserGoals(deps.db, result.user.id)).map((g) => g.text)).toEqual(['Leer 12 libros']);
  });

  it('R-34: si el onboarding es inválido no se crea la cuenta', async () => {
    const deps = await createTestDeps();
    const result = await registerWithOnboarding(deps, ANA, { purpose: '', goals: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['goals', 'purpose']);
    expect(await countRows(deps.db, 'users')).toBe(0);
    expect(deps.session.current).toBeNull();
  });

  it('una entrada inválida no toca la base de datos ni la sesión', async () => {
    const deps = await createTestDeps();
    const result = await registerUser(deps, { ...ANA, password: '12345', privacyAccepted: false });
    expect(result.ok).toBe(false);
    expect(await countRows(deps.db, 'users')).toBe(0);
    expect(deps.session.current).toBeNull();
  });
});

describe('checkAccountAvailability (paso 1 del registro, R-34)', () => {
  it('datos válidos y libres → ok, sin crear nada', async () => {
    const deps = await createTestDeps();
    const result = await checkAccountAvailability(deps, ANA);
    expect(result.ok).toBe(true);
    expect(await countRows(deps.db, 'users')).toBe(0);
    expect(deps.session.current).toBeNull();
  });

  it('usuario (sin distinguir mayúsculas) o correo ocupados → error en su campo', async () => {
    const deps = await createTestDeps();
    await registerUser(deps, ANA);
    expect(await checkAccountAvailability(deps, { ...ANA, username: 'ana_92', email: 'otro@example.com' })).toEqual({
      ok: false,
      errors: { username: 'Ese nombre de usuario ya existe.' },
    });
    expect(await checkAccountAvailability(deps, { ...ANA, username: 'Otro', email: 'ANA@example.com' })).toEqual({
      ok: false,
      errors: { email: 'Ese correo ya está registrado.' },
    });
  });

  it('datos inválidos → errores de validación', async () => {
    const deps = await createTestDeps();
    const result = await checkAccountAvailability(deps, { ...ANA, password: '123', privacyAccepted: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['password', 'privacy']);
  });
});

describe('signIn (RN-AUTH-07)', () => {
  it('entra con el nombre de usuario en cualquier mayúscula o con el correo', async () => {
    const deps = await createTestDeps();
    await registerUser(deps, ANA);
    await signOut(deps);

    const byUsername = await signIn(deps, { identifier: ' ana_92 ', password: 'secreto1' });
    expect(byUsername.ok).toBe(true);
    await signOut(deps);
    const byEmail = await signIn(deps, { identifier: 'ANA@EXAMPLE.COM', password: 'secreto1' });
    expect(byEmail.ok).toBe(true);
    if (byEmail.ok) expect(deps.session.current).toBe(byEmail.user.id);
  });

  it('contraseña incorrecta o usuario inexistente → el mismo mensaje y sin sesión', async () => {
    const deps = await createTestDeps();
    await registerUser(deps, ANA);
    await signOut(deps);

    const wrongPassword = await signIn(deps, { identifier: 'Ana_92', password: 'secreto2' });
    const unknownUser = await signIn(deps, { identifier: 'nadie', password: 'secreto1' });
    expect(wrongPassword).toEqual(unknownUser);
    expect(wrongPassword.ok).toBe(false);
    expect(deps.session.current).toBeNull();
  });

  it('campos vacíos → mensaje de campos obligatorios', async () => {
    const deps = await createTestDeps();
    expect(await signIn(deps, { identifier: ' ', password: '' })).toEqual({
      ok: false,
      error: 'Escribe tu usuario o correo y tu contraseña.',
    });
  });
});

describe('restoreSession y signOut (RN-AUTH-04, RN-AUTH-08)', () => {
  it('sin sesión guardada → null', async () => {
    const deps = await createTestDeps();
    expect(await restoreSession(deps)).toBeNull();
  });

  it('con sesión válida → devuelve el usuario', async () => {
    const deps = await createTestDeps();
    const result = await registerUser(deps, ANA);
    if (!result.ok) throw new Error('registro fallido');
    expect(await restoreSession(deps)).toEqual(result.user);
  });

  it('si la sesión apunta a un usuario inexistente, la limpia', async () => {
    const deps = await createTestDeps();
    deps.session.current = 'usuario-borrado';
    expect(await restoreSession(deps)).toBeNull();
    expect(deps.session.current).toBeNull();
  });

  it('cerrar sesión (dos veces) no borra datos y al volver a entrar el progreso sigue igual', async () => {
    const deps = await createTestDeps();
    const result = await registerUser(deps, ANA);
    if (!result.ok) throw new Error('registro fallido');
    await deps.db.runAsync('UPDATE player_profiles SET mate_leaves_balance = 35 WHERE user_id = ?', [
      result.user.id,
    ]);

    await signOut(deps);
    await signOut(deps);
    expect(deps.session.current).toBeNull();
    expect(await countRows(deps.db, 'users')).toBe(1);

    const again = await signIn(deps, { identifier: 'Ana_92', password: 'secreto1' });
    if (!again.ok) throw new Error('inicio de sesión fallido');
    expect((await loadPlayerProfile(deps.db, again.user.id)).mateLeavesBalance).toBe(35);
  });
});
