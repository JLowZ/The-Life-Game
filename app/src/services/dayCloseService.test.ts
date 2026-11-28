import { listActiveChallenges } from '@/database/repositories/challengesRepository';
import { findSummary, listSummaries } from '@/database/repositories/dailySummariesRepository';
import { listMissionsForDate } from '@/database/repositories/missionsRepository';
import { listOccurrencesForDate } from '@/database/repositories/occurrencesRepository';
import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import { ALL_WEEKDAYS_MASK } from '@/domain/schedule';

import { registerUser } from './authService';
import { completeChallenge } from './challengeService';
import { closeGameDay, closePendingDays, undoDayClose } from './dayCloseService';
import { createHabit, deleteHabit } from './habitService';
import { acceptMission, completeMission } from './missionService';
import { loadToday, markOccurrence } from './occurrenceService';
import { reconcile } from './reconciliationService';
import { createTestDeps } from './testing/createTestDeps';

const FRIDAY_10AM = new Date(2026, 10, 27, 10, 0, 0);
const HOUR_S = 60 * 60;
const EVERY_DAY = { type: 'WEEKLY' as const, weekdays: ALL_WEEKDAYS_MASK };
const STUDY = { name: 'Estudiar', categoryId: 'STUDY', targetQuantity: 60, unit: 'MINUTES', mateLeavesReward: 10, xpReward: 20 };
const READ = { ...STUDY, name: 'Leer', categoryId: 'READING', targetQuantity: 10, unit: 'PAGES' };
const MISSION = { categoryId: 'EXERCISE', description: 'Caminar', targetQuantity: 20, unit: 'minutos' };

type Deps = Awaited<ReturnType<typeof createTestDeps>>;

async function setup(habits = [STUDY, READ]) {
  const deps = await createTestDeps();
  deps.clock.set(FRIDAY_10AM);
  const result = await registerUser(
    deps,
    { username: 'Ana_92', email: 'ana@example.com', password: 'secreto1', privacyAccepted: true },
    { purpose: 'Ser constante', goals: [{ text: 'Aprender a programar', categoryId: 'STUDY' }] },
  );
  if (!result.ok) throw new Error('registro fallido');
  const habitIds: string[] = [];
  for (const habit of habits) {
    const created = await createHabit(deps, result.user.id, habit, EVERY_DAY);
    if (!created.ok) throw new Error('alta fallida');
    habitIds.push(created.habitId);
  }
  return { deps, userId: result.user.id, habitIds };
}

const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute, 0);

async function statuses(deps: Deps, userId: string, gameDate: string) {
  return (await listOccurrencesForDate(deps.db, userId, gameDate)).map((o) => o.status);
}

async function countChallenges(deps: Deps): Promise<number> {
  const row = await deps.db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM challenges', []);
  return row?.total ?? 0;
}

describe('Día Finalizado (RN-CLOSE-02, RN-CLOSE-09, ESC-27)', () => {
  it('ESC-27: cerrar a las 22:00, deshacer a las 23:00, volver a cerrar a las 23:30; deshacer a las 04:01 se rechaza', async () => {
    const { deps, userId } = await setup();
    deps.clock.set(at(27, 22));
    const closed = await closeGameDay(deps, userId);
    expect(closed).toMatchObject({ ok: true, summary: { classification: 'CRITICAL', scheduledCount: 2, missedCount: 2, closeSource: 'MANUAL' } });
    expect(await statuses(deps, userId, '2026-11-27')).toEqual(['MISSED', 'MISSED']);
    expect(await listActiveChallenges(deps.db, userId)).toHaveLength(2);

    deps.clock.set(at(27, 23));
    expect(await undoDayClose(deps, userId)).toEqual({ ok: true });
    expect(await statuses(deps, userId, '2026-11-27')).toEqual(['PENDING', 'PENDING']);
    expect(await countChallenges(deps)).toBe(0);
    expect(await findSummary(deps.db, userId, '2026-11-27')).toBeNull();

    deps.clock.set(at(27, 23, 30));
    expect((await closeGameDay(deps, userId)).ok).toBe(true);
    expect(await countChallenges(deps)).toBe(2);
    expect(await listSummaries(deps.db, userId, '2026-11-01', '2026-11-30')).toHaveLength(1);

    deps.clock.set(at(28, 4, 1));
    expect(await undoDayClose(deps, userId)).toEqual({ ok: false, error: expect.stringContaining('04:00') });
  });

  it('INT-09: cerrar dos veces → un solo resumen y los desafíos una sola vez', async () => {
    const { deps, userId } = await setup();
    deps.clock.set(at(27, 21));
    await closeGameDay(deps, userId);
    expect(await closeGameDay(deps, userId)).toEqual({ ok: false, error: 'Esta jornada ya está finalizada.' });
    expect(await countChallenges(deps)).toBe(2);
  });

  it('ESC-12: Día Finalizado y después la reconciliación de esa jornada → efectos una sola vez', async () => {
    const { deps, userId } = await setup();
    deps.clock.set(at(27, 21));
    await closeGameDay(deps, userId);
    deps.clock.set(at(28, 9));
    await reconcile(deps, userId, { appOpened: true });
    expect(await countChallenges(deps)).toBe(2);
    expect(await findSummary(deps.db, userId, '2026-11-27')).toMatchObject({ closeSource: 'MANUAL' });
    expect(await findSummary(deps.db, userId, '2026-11-28')).toBeNull(); // hoy sigue abierta
  });

  it('las cumplidas no cambian; deshacer no toca lo que marcó el usuario', async () => {
    const { deps, userId } = await setup();
    const [study] = (await loadToday(deps, userId)).occurrences;
    await markOccurrence(deps, userId, study!.id, 'COMPLETED');
    deps.clock.set(at(27, 22));
    await closeGameDay(deps, userId);
    expect(await statuses(deps, userId, '2026-11-27')).toEqual(['COMPLETED', 'MISSED']);
    await undoDayClose(deps, userId);
    expect(await statuses(deps, userId, '2026-11-27')).toEqual(['COMPLETED', 'PENDING']);
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 10, xpTotal: 20 });
  });

  it('no se deshace si ya se completó un desafío creado por el cierre (INT-19)', async () => {
    const { deps, userId } = await setup([STUDY]);
    deps.clock.set(at(27, 22));
    await closeGameDay(deps, userId);
    const [challenge] = await listActiveChallenges(deps.db, userId);
    await completeChallenge(deps, userId, challenge!.id);
    expect((await undoDayClose(deps, userId)).ok).toBe(false);
  });

  it('tras Día Finalizado: no se marca, no se aceptan misiones y un hábito nuevo empieza mañana', async () => {
    const { deps, userId } = await setup([STUDY]);
    const accepted = await acceptMission(deps, userId, MISSION);
    if (!accepted.ok) throw new Error('misión no aceptada');
    deps.clock.set(at(27, 22));
    await closeGameDay(deps, userId);

    expect((await acceptMission(deps, userId, MISSION)).ok).toBe(false);
    expect((await completeMission(deps, userId, accepted.missionId)).ok).toBe(false);
    await createHabit(deps, userId, READ, EVERY_DAY);
    expect(await statuses(deps, userId, '2026-11-27')).toEqual(['MISSED']);

    // Deshacer: la misión aceptada sigue intacta y se puede completar (INT-19).
    await undoDayClose(deps, userId);
    expect(await completeMission(deps, userId, accepted.missionId)).toEqual({ ok: true });
  });
});

describe('cierre automático y reconciliación (RN-CLOSE-01, RN-CLOSE-04, ESC-13)', () => {
  it('ESC-13: 5 días sin abrir la app → 5 jornadas en orden, sus desafíos y la gracia a los vencidos', async () => {
    const { deps, userId } = await setup([STUDY]);
    deps.clock.set(new Date(2026, 11, 2, 10, 0, 0)); // miércoles 2 de diciembre
    await reconcile(deps, userId, { appOpened: true });

    const summaries = await listSummaries(deps.db, userId, '2026-11-01', '2026-12-31');
    expect(summaries.map((s) => [s.gameDate, s.classification, s.closeSource])).toEqual([
      ['2026-11-27', 'CRITICAL', 'AUTO'],
      ['2026-11-28', 'CRITICAL', 'AUTO'],
      ['2026-11-29', 'CRITICAL', 'AUTO'],
      ['2026-11-30', 'CRITICAL', 'AUTO'],
      ['2026-12-01', 'CRITICAL', 'AUTO'],
    ]);
    const active = await listActiveChallenges(deps.db, userId);
    expect(active).toHaveLength(5);
    // RN-DES-09: el automático cuenta desde las 04:00 del cierre lógico.
    const ofDay29 = active.find((c) => c.sourceGameDate === '2026-11-29');
    expect(ofDay29?.deadlineAt).toBe(new Date(new Date(2026, 10, 30, 4, 0, 0).getTime() + 72 * HOUR_S * 1000).toISOString());
    // Los de los días 27 y 28 vencieron con la app cerrada: 12 h de gracia, una vez (INT-18).
    expect(active.filter((c) => c.graceApplied).map((c) => c.sourceGameDate)).toEqual(['2026-11-27', '2026-11-28']);
    expect((await getPlayerProfile(deps.db, userId))?.hpHalfUnits).toBe(20);

    // Reconciliar otra vez no repite nada (INT-09).
    expect(await closePendingDays(deps, userId)).toBe(0);
    expect(await listActiveChallenges(deps.db, userId)).toHaveLength(5);
  });

  it('racha: Perfecto suma, "sin actividades" se salta (ESC-14) y un día incompleto la rompe', async () => {
    const { deps, userId, habitIds } = await setup([STUDY]);
    const [occurrence] = (await loadToday(deps, userId)).occurrences;
    await markOccurrence(deps, userId, occurrence!.id, 'COMPLETED');
    deps.clock.set(at(28, 9));
    await deleteHabit(deps, userId, habitIds[0]!); // el 28 ya no hay nada programado
    deps.clock.set(at(29, 9));
    await reconcile(deps, userId, { appOpened: true });
    expect((await findSummary(deps.db, userId, '2026-11-27'))?.classification).toBe('PERFECT');
    expect(await findSummary(deps.db, userId, '2026-11-28')).toMatchObject({
      classification: 'NO_ACTIVITY',
      streakBefore: 1,
      streakAfter: 1,
    });
    expect((await getPlayerProfile(deps.db, userId))?.perfectStreak).toBe(1);

    await createHabit(deps, userId, READ, EVERY_DAY);
    deps.clock.set(at(30, 9));
    await reconcile(deps, userId, { appOpened: true });
    expect((await findSummary(deps.db, userId, '2026-11-29'))?.classification).toBe('CRITICAL');
    expect((await getPlayerProfile(deps.db, userId))?.perfectStreak).toBe(0);
  });

  it('las misiones aceptadas de una jornada terminada pasan a abandonadas sin coste (P-58)', async () => {
    const { deps, userId } = await setup([]);
    await acceptMission(deps, userId, MISSION);
    deps.clock.set(at(28, 9));
    await reconcile(deps, userId, { appOpened: true });
    expect((await listMissionsForDate(deps.db, userId, '2026-11-27')).map((m) => m.status)).toEqual(['ABANDONED']);
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 0, xpTotal: 0, hpHalfUnits: 20 });
  });
});

describe('jornadas en pausa a 0 HP (P-50, RN-MAP-09, ESC-21)', () => {
  it('a 0 HP, las pendientes pasan a PAUSED, sin desafíos ni racha', async () => {
    const { deps, userId } = await setup();
    await deps.db.runAsync('UPDATE player_profiles SET hp_half_units = 0, perfect_streak = 3 WHERE user_id = ?', [userId]);
    deps.clock.set(at(28, 9));
    await reconcile(deps, userId, { appOpened: true });
    expect(await statuses(deps, userId, '2026-11-27')).toEqual(['PAUSED', 'PAUSED']);
    expect(await countChallenges(deps)).toBe(0);
    expect(await findSummary(deps.db, userId, '2026-11-27')).toMatchObject({ classification: 'PAUSED', streakAfter: 3 });
  });

  it('a 0 HP no se programa: crear un hábito se rechaza (RN-NAV-04)', async () => {
    const { deps, userId } = await setup([]);
    await deps.db.runAsync('UPDATE player_profiles SET hp_half_units = 0 WHERE user_id = ?', [userId]);
    expect(await createHabit(deps, userId, STUDY, EVERY_DAY)).toEqual({
      ok: false,
      errors: { schedule: expect.stringContaining('Sin vidas') },
    });
  });
});
