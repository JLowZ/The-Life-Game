import { listActiveChallenges } from '@/database/repositories/challengesRepository';
import { sumLedgers } from '@/database/repositories/ledgerRepository';
import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import { ALL_WEEKDAYS_MASK } from '@/domain/schedule';
import type { SqlDatabase } from '@/database/types';

import { registerUser } from './authService';
import { completeChallenge, reconcileChallenges } from './challengeService';
import { createHabit } from './habitService';
import { abandonMission, acceptMission, completeMission, suggestMission } from './missionService';
import { loadToday, markOccurrence, undoMark } from './occurrenceService';
import { reconcile } from './reconciliationService';
import { createTestDeps } from './testing/createTestDeps';

const FRIDAY_10AM = new Date(2026, 10, 27, 10, 0, 0);
const HOUR_S = 60 * 60;
const EVERY_DAY = { type: 'WEEKLY' as const, weekdays: ALL_WEEKDAYS_MASK };
const STUDY = { name: 'Estudiar', categoryId: 'STUDY', targetQuantity: 60, unit: 'MINUTES', mateLeavesReward: 10, xpReward: 20 };

type Deps = Awaited<ReturnType<typeof createTestDeps>>;

async function setup() {
  const deps = await createTestDeps();
  deps.clock.set(FRIDAY_10AM);
  const result = await registerUser(
    deps,
    { username: 'Ana_92', email: 'ana@example.com', password: 'secreto1', privacyAccepted: true },
    { purpose: 'Ser constante', goals: [{ text: 'Aprender a programar', categoryId: 'STUDY' }] },
  );
  if (!result.ok) throw new Error('registro fallido');
  return { deps, userId: result.user.id };
}

/** Crea el hábito, lo marca incumplido y devuelve su desafío. */
async function missHabit(deps: Deps, userId: string, habit = STUDY) {
  const created = await createHabit(deps, userId, habit, EVERY_DAY);
  if (!created.ok) throw new Error('alta fallida');
  const occurrence = (await loadToday(deps, userId)).occurrences.find((o) => o.habitName === habit.name);
  if (!occurrence) throw new Error('sin ocurrencia');
  expect(await markOccurrence(deps, userId, occurrence.id, 'MISSED')).toEqual({ ok: true });
  const challenge = (await listActiveChallenges(deps.db, userId)).find((c) => c.sourceOccurrenceId === occurrence.id);
  if (!challenge) throw new Error('sin desafío');
  return { occurrenceId: occurrence.id, challenge };
}

async function hp(deps: Deps, userId: string) {
  return (await getPlayerProfile(deps.db, userId))?.hpHalfUnits;
}

async function countChallenges(db: SqlDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM challenges', []);
  return row?.total ?? 0;
}

async function expectLedgersMatchProfile(deps: Deps, userId: string) {
  const profile = await getPlayerProfile(deps.db, userId);
  expect(await sumLedgers(deps.db, userId)).toEqual({ leaves: profile?.mateLeavesBalance, xp: profile?.xpTotal });
}

describe('desafío por incumplimiento (RN-DAY-06, RN-DES-03..10)', () => {
  it('"No cumplido" crea UN desafío normal del 50 %, con plazo de 72 h y ½ Hojas + 20 % XP', async () => {
    const { deps, userId } = await setup();
    const { challenge } = await missHabit(deps, userId);
    expect(challenge).toMatchObject({
      kind: 'MISSED_HABIT',
      variant: 'NORMAL',
      title: 'Estudiar: 30 minutos',
      targetQuantity: 30,
      status: 'PENDING',
      mateLeavesReward: 5,
      xpReward: 4,
      deadlineAt: new Date(FRIDAY_10AM.getTime() + 72 * HOUR_S * 1000).toISOString(),
    });
    expect(await hp(deps, userId)).toBe(20); // RN-HP-03: no se resta al marcar
  });

  it('con ánimo "Muy mal" el desafío es mini del 10 % (ESC-08)', async () => {
    const { deps, userId } = await setup();
    await deps.db.runAsync(
      `INSERT INTO mood_entries (id, user_id, game_date, mood, recorded_at) VALUES ('m', ?, '2026-11-27', 'VERY_BAD', ?)`,
      [userId, FRIDAY_10AM.toISOString()],
    );
    const { challenge } = await missHabit(deps, userId);
    expect(challenge).toMatchObject({ variant: 'MINI', title: 'Estudiar: 6 minutos', targetQuantity: 6 });
  });

  it('INT-06: deshacer el incumplimiento borra el desafío; volver a incumplir deja uno solo', async () => {
    const { deps, userId } = await setup();
    const { occurrenceId } = await missHabit(deps, userId);
    deps.clock.advanceSeconds(3);
    expect(await undoMark(deps, userId, occurrenceId)).toEqual({ ok: true });
    expect(await countChallenges(deps.db)).toBe(0);
    await markOccurrence(deps, userId, occurrenceId, 'MISSED');
    expect(await countChallenges(deps.db)).toBe(1);
  });

  it('ESC-09: completarlo en plazo → +5 Hojas +4 XP, sin pérdida; la ocurrencia sigue incumplida; dos veces = una', async () => {
    const { deps, userId } = await setup();
    const { challenge } = await missHabit(deps, userId);
    expect(await completeChallenge(deps, userId, challenge.id)).toEqual({ ok: true });
    expect(await completeChallenge(deps, userId, challenge.id)).toEqual({ ok: false, error: 'Este desafío ya no está activo.' });
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 5, xpTotal: 4, hpHalfUnits: 20 });
    expect((await loadToday(deps, userId)).occurrences[0]?.status).toBe('MISSED');
    await expectLedgersMatchProfile(deps, userId);
  });

  it('no se puede deshacer el incumplimiento si su desafío ya se completó', async () => {
    const { deps, userId } = await setup();
    const { occurrenceId, challenge } = await missHabit(deps, userId);
    await completeChallenge(deps, userId, challenge.id);
    expect((await undoMark(deps, userId, occurrenceId)).ok).toBe(false);
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 5, xpTotal: 4 });
  });

  it('ESC-30: hábito de 25 Hojas y 30 XP → +12 Hojas, +6 XP', async () => {
    const { deps, userId } = await setup();
    const { challenge } = await missHabit(deps, userId, { ...STUDY, mateLeavesReward: 25, xpReward: 30 });
    await completeChallenge(deps, userId, challenge.id);
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 12, xpTotal: 6 });
  });

  it('ESC-19: a las 72 h exactas ya no se puede completar, aunque el vencimiento no se haya procesado', async () => {
    const { deps, userId } = await setup();
    const { challenge } = await missHabit(deps, userId);
    deps.clock.advanceSeconds(72 * HOUR_S);
    expect(await completeChallenge(deps, userId, challenge.id)).toEqual({
      ok: false,
      error: 'El plazo de este desafío ya terminó.',
    });
  });
});

describe('vencimiento y recuperación (RN-DES-07, RN-HP-03..06, ESC-11, ESC-20, ESC-31)', () => {
  it('ESC-11 / ESC-31: vence → −1 unidad y un desafío de recuperación; completarlo → +1, +5 Hojas, +4 XP', async () => {
    const { deps, userId } = await setup();
    await missHabit(deps, userId);
    deps.clock.advanceSeconds(72 * HOUR_S);
    expect(await reconcileChallenges(deps, userId, { appOpened: false })).toEqual({ graced: 0, expired: 1 });
    expect(await hp(deps, userId)).toBe(19);

    const [recovery] = await listActiveChallenges(deps.db, userId);
    expect(recovery).toMatchObject({ kind: 'RECOVERY', deadlineAt: null, targetQuantity: 30, mateLeavesReward: 5, xpReward: 4 });
    if (!recovery) throw new Error('sin recuperación');
    deps.clock.advanceSeconds(1000 * HOUR_S); // sin plazo
    expect(await completeChallenge(deps, userId, recovery.id)).toEqual({ ok: true });
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ hpHalfUnits: 20, mateLeavesBalance: 5, xpTotal: 4 });
    await expectLedgersMatchProfile(deps, userId);
  });

  it('reconciliar dos veces: una sola pérdida y una sola recuperación (INT-02, RN-HP-05)', async () => {
    const { deps, userId } = await setup();
    await missHabit(deps, userId);
    deps.clock.advanceSeconds(73 * HOUR_S);
    await reconcileChallenges(deps, userId, { appOpened: false });
    expect(await reconcileChallenges(deps, userId, { appOpened: false })).toEqual({ graced: 0, expired: 0 });
    expect(await hp(deps, userId)).toBe(19);
    expect(await listActiveChallenges(deps.db, userId)).toHaveLength(1);
  });

  it('ESC-20: completar una recuperación con otro desafío pendiente → +1 unidad; el pendiente sigue igual', async () => {
    const { deps, userId } = await setup();
    await missHabit(deps, userId);
    deps.clock.advanceSeconds(72 * HOUR_S);
    await reconcileChallenges(deps, userId, { appOpened: false });
    const { challenge: pending } = await missHabit(deps, userId, { ...STUDY, name: 'Leer', categoryId: 'READING' });
    const recovery = (await listActiveChallenges(deps.db, userId)).find((c) => c.kind === 'RECOVERY');
    if (!recovery) throw new Error('sin recuperación');
    await completeChallenge(deps, userId, recovery.id);
    expect(await hp(deps, userId)).toBe(20);
    expect((await listActiveChallenges(deps.db, userId)).map((c) => [c.id, c.status])).toEqual([[pending.id, 'PENDING']]);
  });

  it('gracia: al abrir la app con el plazo vencido → 12 h más, una sola vez (INT-18)', async () => {
    const { deps, userId } = await setup();
    await missHabit(deps, userId);
    deps.clock.advanceSeconds(80 * HOUR_S);
    expect(await reconcileChallenges(deps, userId, { appOpened: true })).toEqual({ graced: 1, expired: 0 });
    expect(await hp(deps, userId)).toBe(20);
    deps.clock.advanceSeconds(12 * HOUR_S);
    // Vuelve a vencer: aunque se abra la app otra vez, ya no hay gracia.
    expect(await reconcileChallenges(deps, userId, { appOpened: true })).toEqual({ graced: 0, expired: 1 });
    expect(await hp(deps, userId)).toBe(19);
  });

  it('prueba manual 5 de la Fase 7 con la reconciliación real de la app: 3 días cerrada → gracia; 13 h más → −½ corazón y recuperación', async () => {
    const { deps, userId } = await setup();
    const { challenge } = await missHabit(deps, userId);

    // El teléfono "salta" 3 días con la app cerrada; al abrirla corre la misma reconciliación que en _layout.
    deps.clock.advanceSeconds(72 * HOUR_S);
    await reconcile(deps, userId, { appOpened: true });
    const [graced] = await listActiveChallenges(deps.db, userId);
    expect(graced).toMatchObject({
      id: challenge.id,
      status: 'PENDING',
      graceApplied: true,
      deadlineAt: new Date(deps.now().getTime() + 12 * HOUR_S * 1000).toISOString(), // RN-DES-10
    });
    expect(await hp(deps, userId)).toBe(20);

    // 13 h después la gracia ya pasó: se pierde una unidad (½ corazón) y nace la recuperación.
    deps.clock.advanceSeconds(13 * HOUR_S);
    await reconcile(deps, userId, { appOpened: true });
    expect(await hp(deps, userId)).toBe(19);
    expect(await completeChallenge(deps, userId, challenge.id)).not.toEqual({ ok: true }); // RN-DES-08
    const active = await listActiveChallenges(deps.db, userId);
    expect(active.map((c) => c.kind)).toEqual(['RECOVERY']);

    // Reconciliar otra vez no vuelve a restar (INT-02) y completar la recuperación devuelve la unidad.
    await reconcile(deps, userId, { appOpened: true });
    expect(await hp(deps, userId)).toBe(19);
    expect(await completeChallenge(deps, userId, active[0]!.id)).toEqual({ ok: true });
    expect(await hp(deps, userId)).toBe(20);
    await expectLedgersMatchProfile(deps, userId);
  });

  it('límite de HP: a 0 unidades, vencer registra delta 0 y no crea recuperación (R-25, RN-HP-09)', async () => {
    const { deps, userId } = await setup();
    await missHabit(deps, userId);
    await deps.db.runAsync('UPDATE player_profiles SET hp_half_units = 0 WHERE user_id = ?', [userId]);
    deps.clock.advanceSeconds(72 * HOUR_S);
    await reconcileChallenges(deps, userId, { appOpened: false });
    expect(await hp(deps, userId)).toBe(0);
    expect(await listActiveChallenges(deps.db, userId)).toHaveLength(0);
  });

  it('a 0 HP, completar un desafío por incumplimiento devuelve 1 unidad (RN-HP-10)', async () => {
    const { deps, userId } = await setup();
    const { challenge } = await missHabit(deps, userId);
    await deps.db.runAsync('UPDATE player_profiles SET hp_half_units = 0 WHERE user_id = ?', [userId]);
    await completeChallenge(deps, userId, challenge.id);
    expect(await hp(deps, userId)).toBe(1);
  });
});

describe('misiones secundarias (RN-MIS-01..06, ESC-26, ESC-28)', () => {
  const MISSION = { categoryId: 'EXERCISE', description: 'Caminar', targetQuantity: 20, unit: 'minutos' };

  it('ESC-26: completar (dos veces) → +20 Hojas +20 XP una sola vez', async () => {
    const { deps, userId } = await setup();
    const accepted = await acceptMission(deps, userId, MISSION);
    if (!accepted.ok) throw new Error(accepted.error);
    expect(await completeMission(deps, userId, accepted.missionId)).toEqual({ ok: true });
    expect((await completeMission(deps, userId, accepted.missionId)).ok).toBe(false);
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 20, xpTotal: 20 });
    await expectLedgersMatchProfile(deps, userId);
  });

  it('ESC-28: la 4.ª del día se rechaza; abandonar una libera el hueco (P-58) y no cuesta nada', async () => {
    const { deps, userId } = await setup();
    const ids: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const result = await acceptMission(deps, userId, MISSION);
      if (result.ok) ids.push(result.missionId);
    }
    expect(await acceptMission(deps, userId, MISSION)).toEqual({
      ok: false,
      error: 'Ya tienes 3 misiones secundarias hoy. ¡Vuelve mañana!',
    });
    expect(await abandonMission(deps, userId, ids[0] ?? '')).toEqual({ ok: true });
    expect((await abandonMission(deps, userId, ids[0] ?? '')).ok).toBe(false);
    expect((await acceptMission(deps, userId, MISSION)).ok).toBe(true);
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 0, xpTotal: 0, hpHalfUnits: 20 });
  });

  it('una misión de ayer ya no se puede completar; a 0 HP no se aceptan (RN-MIS-05)', async () => {
    const { deps, userId } = await setup();
    const accepted = await acceptMission(deps, userId, MISSION);
    if (!accepted.ok) throw new Error(accepted.error);
    deps.clock.set(new Date(2026, 10, 28, 10, 0, 0));
    expect((await completeMission(deps, userId, accepted.missionId)).ok).toBe(false);
    await deps.db.runAsync('UPDATE player_profiles SET hp_half_units = 0 WHERE user_id = ?', [userId]);
    expect((await acceptMission(deps, userId, MISSION)).ok).toBe(false);
  });

  it('sugerencia: usa un hábito de la categoría, luego una meta y si no, la de la categoría', async () => {
    const { deps, userId } = await setup();
    expect(await suggestMission(deps, userId, 'STUDY')).toMatchObject({
      description: expect.stringContaining('Aprender a programar'),
    });
    await createHabit(deps, userId, STUDY, EVERY_DAY);
    expect(await suggestMission(deps, userId, 'STUDY')).toEqual({
      description: 'Sesión extra de Estudiar',
      targetQuantity: 30,
      unit: 'minutos',
    });
    expect(await suggestMission(deps, userId, 'HOME')).toEqual({
      description: 'Ordenar un espacio de tu casa',
      targetQuantity: 15,
      unit: 'minutos',
    });
  });
});
