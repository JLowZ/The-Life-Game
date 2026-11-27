import { listOccurrencesForDate } from '@/database/repositories/occurrencesRepository';
import { sumLedgers } from '@/database/repositories/ledgerRepository';
import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import { ALL_WEEKDAYS_MASK, maskFromWeekdays } from '@/domain/schedule';

import { registerUser } from './authService';
import { createHabit, deleteHabit, getHabit, listHabits, updateHabit } from './habitService';
import { ensureOccurrencesForDate, loadToday, markOccurrence, undoMark } from './occurrenceService';
import { createTestDeps } from './testing/createTestDeps';

/** Viernes 27-nov-2026 a las 10:00, hora local del equipo que corre las pruebas. */
const FRIDAY_10AM = new Date(2026, 10, 27, 10, 0, 0);
const TODAY = '2026-11-27';
const TOMORROW = '2026-11-28';
const FRIDAY_INDEX = 4;

const READING = {
  name: 'Leer',
  categoryId: 'READING',
  targetQuantity: 20,
  unit: 'PAGES',
  mateLeavesReward: 10,
  xpReward: 20,
};
const EVERY_DAY = { type: 'WEEKLY' as const, weekdays: ALL_WEEKDAYS_MASK };

async function setup() {
  const deps = await createTestDeps();
  deps.clock.set(FRIDAY_10AM);
  const result = await registerUser(
    deps,
    { username: 'Ana_92', email: 'ana@example.com', password: 'secreto1', privacyAccepted: true },
    { purpose: 'Ser constante', goals: [{ text: 'Leer', categoryId: 'READING' }] },
  );
  if (!result.ok) throw new Error('registro fallido');
  return { deps, userId: result.user.id };
}

async function createEveryDayHabit(deps: Awaited<ReturnType<typeof setup>>['deps'], userId: string) {
  const created = await createHabit(deps, userId, READING, EVERY_DAY);
  if (!created.ok) throw new Error(JSON.stringify(created.errors));
  const { occurrences } = await loadToday(deps, userId);
  const [today] = occurrences;
  if (!today) throw new Error('sin ocurrencia de hoy');
  return { habitId: created.habitId, occurrenceId: today.id };
}

/** INT-14: el saldo guardado coincide con la suma de sus movimientos. */
async function expectLedgersMatchProfile(deps: Awaited<ReturnType<typeof setup>>['deps'], userId: string) {
  const profile = await getPlayerProfile(deps.db, userId);
  const sums = await sumLedgers(deps.db, userId);
  expect(sums).toEqual({ leaves: profile?.mateLeavesBalance, xp: profile?.xpTotal });
}

describe('crear hábitos y programarlos (RN-HAB-01..04, RN-DAY-08)', () => {
  it('programado para hoy → aparece en las Misiones del día con la copia de sus valores', async () => {
    const { deps, userId } = await setup();
    await createEveryDayHabit(deps, userId);
    const { gameDate, occurrences } = await loadToday(deps, userId);
    expect(gameDate).toBe(TODAY);
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]).toMatchObject({
      habitArchived: false,
      status: 'PENDING',
      habitName: 'Leer',
      targetQuantity: 20,
      unit: 'PAGES',
      mateLeavesReward: 10,
      xpReward: 20,
    });
  });

  it('cargar el día dos veces no duplica ocurrencias (una por hábito y jornada, RN-HAB-04)', async () => {
    const { deps, userId } = await setup();
    await createEveryDayHabit(deps, userId);
    await loadToday(deps, userId);
    await loadToday(deps, userId);
    expect(await listOccurrencesForDate(deps.db, userId, TODAY)).toHaveLength(1);
  });

  it('no programado hoy → no aparece; fechas concretas solo en sus fechas', async () => {
    const { deps, userId } = await setup();
    await createHabit(deps, userId, READING, { type: 'WEEKLY', weekdays: maskFromWeekdays([0]) }); // lunes
    await createHabit(deps, userId, { ...READING, name: 'Correr' }, { type: 'SPECIFIC_DATES', dates: [TOMORROW] });
    expect((await loadToday(deps, userId)).occurrences).toHaveLength(0);
    await ensureOccurrencesForDate(deps, userId, TOMORROW);
    expect((await listOccurrencesForDate(deps.db, userId, TOMORROW)).map((o) => o.habitName)).toEqual(['Correr']);
  });

  it('ESC-02: rechaza 12 Hojas y 51 XP, y una programación sin días', async () => {
    const { deps, userId } = await setup();
    const result = await createHabit(
      deps,
      userId,
      { ...READING, mateLeavesReward: 12, xpReward: 51 },
      { type: 'WEEKLY', weekdays: 0 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['mateLeavesReward', 'schedule', 'xpReward']);
    expect(await listHabits(deps, userId)).toHaveLength(0);
  });
});

describe('marcar y deshacer (RN-DAY-03..07)', () => {
  it('ESC-01: marcar cumplido dos veces → +10 Hojas y +20 XP una sola vez', async () => {
    const { deps, userId } = await setup();
    const { occurrenceId } = await createEveryDayHabit(deps, userId);
    expect(await markOccurrence(deps, userId, occurrenceId, 'COMPLETED')).toEqual({ ok: true });
    expect(await markOccurrence(deps, userId, occurrenceId, 'COMPLETED')).toEqual({
      ok: false,
      error: 'Este hábito ya está marcado.',
    });
    const profile = await getPlayerProfile(deps.db, userId);
    expect(profile).toMatchObject({ mateLeavesBalance: 10, xpTotal: 20 });
    await expectLedgersMatchProfile(deps, userId);
  });

  it('ESC-24: deshacer a los 5 s revierte; volver a marcar acredita otra vez; a los 15 s no se deshace', async () => {
    const { deps, userId } = await setup();
    const { occurrenceId } = await createEveryDayHabit(deps, userId);

    await markOccurrence(deps, userId, occurrenceId, 'COMPLETED');
    deps.clock.advanceSeconds(5);
    expect(await undoMark(deps, userId, occurrenceId)).toEqual({ ok: true });
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 0, xpTotal: 0 });
    // Deshacer dos veces: la segunda no hace nada.
    expect((await undoMark(deps, userId, occurrenceId)).ok).toBe(false);

    await markOccurrence(deps, userId, occurrenceId, 'COMPLETED'); // seq 2: nueva clave, sí paga
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 10, xpTotal: 20 });
    deps.clock.advanceSeconds(15);
    expect(await undoMark(deps, userId, occurrenceId)).toEqual({
      ok: false,
      error: 'Ya pasaron los 10 segundos para deshacer.',
    });
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 10, xpTotal: 20 });
    await expectLedgersMatchProfile(deps, userId);
  });

  it('incumplido: sin Hojas ni XP; se puede deshacer dentro de la ventana', async () => {
    const { deps, userId } = await setup();
    const { occurrenceId } = await createEveryDayHabit(deps, userId);
    await markOccurrence(deps, userId, occurrenceId, 'MISSED');
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 0, xpTotal: 0 });
    expect((await loadToday(deps, userId)).occurrences[0]?.status).toBe('MISSED');
    expect(await undoMark(deps, userId, occurrenceId)).toEqual({ ok: true });
    expect((await loadToday(deps, userId)).occurrences[0]?.status).toBe('PENDING');
  });

  it('jornada: a las 03:59 del sábado aún se marca el viernes; a las 04:00 ya no (RN-DAY-01)', async () => {
    const { deps, userId } = await setup();
    const first = await createEveryDayHabit(deps, userId);
    const second = await createHabit(deps, userId, { ...READING, name: 'Correr' }, EVERY_DAY);
    if (!second.ok) throw new Error('alta fallida');
    const secondOccurrence = (await loadToday(deps, userId)).occurrences.find((o) => o.habitName === 'Correr');
    if (!secondOccurrence) throw new Error('sin segunda ocurrencia');

    deps.clock.set(new Date(2026, 10, 28, 3, 59, 0));
    expect(await markOccurrence(deps, userId, first.occurrenceId, 'COMPLETED')).toEqual({ ok: true });
    deps.clock.set(new Date(2026, 10, 28, 4, 0, 0));
    expect(await markOccurrence(deps, userId, secondOccurrence.id, 'COMPLETED')).toEqual({
      ok: false,
      error: 'La jornada de este hábito ya terminó.',
    });
  });

  it('a 0 HP no se marca (RN-NAV-04, INT-17)', async () => {
    const { deps, userId } = await setup();
    const { occurrenceId } = await createEveryDayHabit(deps, userId);
    await deps.db.runAsync('UPDATE player_profiles SET hp_half_units = 0 WHERE user_id = ?', [userId]);
    expect((await markOccurrence(deps, userId, occurrenceId, 'COMPLETED')).ok).toBe(false);
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ mateLeavesBalance: 0, xpTotal: 0 });
  });

  it('acreditar recalcula el nivel: 90 XP + 20 = 110 → nivel 1 (RN-XP-02)', async () => {
    const { deps, userId } = await setup();
    const { occurrenceId } = await createEveryDayHabit(deps, userId);
    // Saldo previo coherente con su libro (INT-14).
    await deps.db.runAsync(
      `INSERT INTO xp_transactions (id, user_id, amount, type, source_type, source_id, idempotency_key, xp_total_after, created_at)
       VALUES ('x0', ?, 90, 'MISSION_REWARD', 'TEST', 't', 'test-seed', 90, ?)`,
      [userId, FRIDAY_10AM.toISOString()],
    );
    await deps.db.runAsync('UPDATE player_profiles SET xp_total = 90 WHERE user_id = ?', [userId]);
    await markOccurrence(deps, userId, occurrenceId, 'COMPLETED');
    expect(await getPlayerProfile(deps.db, userId)).toMatchObject({ xpTotal: 110, level: 1 });
  });
});

describe('editar y eliminar (RN-HAB-05..07, ESC-18)', () => {
  it('ESC-18: cerradas sin cambios, la de hoy conserva sus valores, las futuras tienen los nuevos', async () => {
    const { deps, userId } = await setup();
    const { habitId, occurrenceId } = await createEveryDayHabit(deps, userId);
    // Una ocurrencia de ayer ya cerrada (historial).
    await deps.db.runAsync(
      `INSERT INTO habit_occurrences (id, user_id, habit_id, game_date, status, habit_name_snapshot,
         category_id_snapshot, target_quantity_snapshot, unit_snapshot, mate_leaves_reward_snapshot,
         xp_reward_snapshot, resolved_at, resolution_source, resolution_seq, created_at, updated_at)
       VALUES ('ayer', ?, ?, '2026-11-26', 'COMPLETED', 'Leer', 'READING', 20, 'PAGES', 10, 20, ?, 'USER', 1, ?, ?)`,
      [userId, habitId, FRIDAY_10AM.toISOString(), FRIDAY_10AM.toISOString(), FRIDAY_10AM.toISOString()],
    );

    const edited = await updateHabit(deps, userId, habitId, { ...READING, mateLeavesReward: 30, xpReward: 50 }, EVERY_DAY);
    expect(edited.ok).toBe(true);

    const [yesterday] = await listOccurrencesForDate(deps.db, userId, '2026-11-26');
    const [today] = await listOccurrencesForDate(deps.db, userId, TODAY);
    expect(yesterday).toMatchObject({ mateLeavesReward: 10, xpReward: 20 });
    expect(today).toMatchObject({ id: occurrenceId, mateLeavesReward: 10, xpReward: 20 });
    await ensureOccurrencesForDate(deps, userId, TOMORROW);
    const [tomorrow] = await listOccurrencesForDate(deps.db, userId, TOMORROW);
    expect(tomorrow).toMatchObject({ mateLeavesReward: 30, xpReward: 50 });
  });

  it('cambiar la programación solo afecta al futuro (RN-HAB-07)', async () => {
    const { deps, userId } = await setup();
    const { habitId } = await createEveryDayHabit(deps, userId);
    // Ahora solo los viernes: mañana (sábado) ya no toca; hoy (viernes) se conserva.
    await updateHabit(deps, userId, habitId, READING, { type: 'WEEKLY', weekdays: maskFromWeekdays([FRIDAY_INDEX]) });
    expect(await listOccurrencesForDate(deps.db, userId, TODAY)).toHaveLength(1);
    await ensureOccurrencesForDate(deps, userId, TOMORROW);
    expect(await listOccurrencesForDate(deps.db, userId, TOMORROW)).toHaveLength(0);
    expect((await getHabit(deps, userId, habitId))?.schedule).toEqual({
      type: 'WEEKLY',
      weekdays: maskFromWeekdays([FRIDAY_INDEX]),
    });
  });

  it('RN-HAB-06: eliminar (dos veces) conserva la de hoy y ya no se programa mañana', async () => {
    const { deps, userId } = await setup();
    const { habitId, occurrenceId } = await createEveryDayHabit(deps, userId);
    expect(await deleteHabit(deps, userId, habitId)).toBe(true);
    expect(await deleteHabit(deps, userId, habitId)).toBe(false);
    expect(await listHabits(deps, userId)).toHaveLength(0);
    // Se conserva la misión de hoy, marcada como hábito eliminado para avisar en la interfaz.
    expect((await loadToday(deps, userId)).occurrences.map((o) => [o.id, o.habitArchived])).toEqual([
      [occurrenceId, true],
    ]);
    await ensureOccurrencesForDate(deps, userId, TOMORROW);
    expect(await listOccurrencesForDate(deps.db, userId, TOMORROW)).toHaveLength(0);
    // La de hoy aún se puede marcar.
    expect(await markOccurrence(deps, userId, occurrenceId, 'COMPLETED')).toEqual({ ok: true });
  });

  it('no se pueden editar ni borrar hábitos de otra cuenta', async () => {
    const { deps, userId } = await setup();
    const { habitId } = await createEveryDayHabit(deps, userId);
    expect((await updateHabit(deps, 'otra', habitId, READING, EVERY_DAY)).ok).toBe(false);
    expect(await deleteHabit(deps, 'otra', habitId)).toBe(false);
  });
});
