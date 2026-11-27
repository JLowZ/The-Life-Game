import { getGameDate } from './gameDay';
import { applyBalanceDeltas, decideMark, decideUndo } from './habitMarking';
import { difficultyForXp, validateHabit } from './habits';
import {
  addDays,
  isScheduledOn,
  maskFromWeekdays,
  validateSchedule,
  weekdayIndex,
  weekdaysFromMask,
} from './schedule';
import type { HabitOccurrence, HabitSchedule } from './types';

const HABIT = {
  name: ' Leer ',
  categoryId: 'READING',
  targetQuantity: 20,
  unit: 'PAGES',
  mateLeavesReward: 10,
  xpReward: 20,
};

describe('validateHabit (RN-HAB-02, RN-HAB-08, RN-HAB-09, INT-04)', () => {
  it('acepta un hábito válido y recorta el nombre', () => {
    const result = validateHabit(HABIT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe('Leer');
  });

  it('ESC-02: Hojas 0, 5 y 30 sí; 12 y 35 no. XP 50 sí; 51 no', () => {
    for (const leaves of [0, 5, 30]) expect(validateHabit({ ...HABIT, mateLeavesReward: leaves }).ok).toBe(true);
    for (const leaves of [12, 35]) expect(validateHabit({ ...HABIT, mateLeavesReward: leaves }).ok).toBe(false);
    expect(validateHabit({ ...HABIT, xpReward: 50 }).ok).toBe(true);
    expect(validateHabit({ ...HABIT, xpReward: 51 }).ok).toBe(false);
  });

  it('exige cantidad entera > 0, unidad y categoría', () => {
    expect(validateHabit({ ...HABIT, targetQuantity: 0 }).ok).toBe(false);
    expect(validateHabit({ ...HABIT, targetQuantity: 2.5 }).ok).toBe(false);
    expect(validateHabit({ ...HABIT, targetQuantity: 1 }).ok).toBe(true);
    expect(validateHabit({ ...HABIT, unit: '  ' }).ok).toBe(false);
    expect(validateHabit({ ...HABIT, unit: 'abdominales' }).ok).toBe(true); // unidad libre
    expect(validateHabit({ ...HABIT, categoryId: 'GAMING' }).ok).toBe(false);
  });

  it('presenta la XP como dificultad', () => {
    expect([0, 10, 20, 30, 40, 50].map(difficultyForXp)).toEqual([
      'NONE',
      'EASY',
      'MEDIUM',
      'MEDIUM',
      'HARD',
      'HARD',
    ]);
  });
});

describe('programación (RN-HAB-03, RN-HAB-07)', () => {
  it('máscara semanal: L-M-V = 21; bit 0 = lunes', () => {
    expect(maskFromWeekdays([0, 2, 4])).toBe(21);
    expect(weekdaysFromMask(21)).toEqual([0, 2, 4]);
    expect(weekdayIndex('2026-11-30')).toBe(0); // lunes
    expect(weekdayIndex('2026-11-29')).toBe(6); // domingo
  });

  it('addDays cruza meses y años', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('respeta los días y la vigencia', () => {
    const weekly: HabitSchedule = {
      id: 's',
      habitId: 'h',
      type: 'WEEKLY',
      weekdays: maskFromWeekdays([0]),
      specificDate: null,
      validFrom: '2026-11-30',
      validTo: '2026-12-13',
    };
    expect(isScheduledOn(weekly, '2026-11-23')).toBe(false); // lunes antes de la vigencia
    expect(isScheduledOn(weekly, '2026-11-30')).toBe(true);
    expect(isScheduledOn(weekly, '2026-12-01')).toBe(false); // martes
    expect(isScheduledOn(weekly, '2026-12-07')).toBe(true);
    expect(isScheduledOn(weekly, '2026-12-14')).toBe(false); // lunes después de valid_to
    const specific: HabitSchedule = { ...weekly, type: 'SPECIFIC_DATE', weekdays: null, specificDate: '2026-12-02', validTo: null };
    expect(isScheduledOn(specific, '2026-12-02')).toBe(true);
    expect(isScheduledOn(specific, '2026-12-03')).toBe(false);
  });

  it('valida: al menos un día y sin fechas pasadas', () => {
    expect(validateSchedule({ type: 'WEEKLY', weekdays: 0 }, '2026-11-27').ok).toBe(false);
    expect(validateSchedule({ type: 'WEEKLY', weekdays: 127 }, '2026-11-27').ok).toBe(true);
    expect(validateSchedule({ type: 'SPECIFIC_DATES', dates: [] }, '2026-11-27').ok).toBe(false);
    expect(validateSchedule({ type: 'SPECIFIC_DATES', dates: ['2026-11-26'] }, '2026-11-27').ok).toBe(false);
    expect(validateSchedule({ type: 'SPECIFIC_DATES', dates: ['2026-02-30'] }, '2026-01-01').ok).toBe(false);
    expect(validateSchedule({ type: 'SPECIFIC_DATES', dates: ['2026-11-28', '2026-11-27', '2026-11-28'] }, '2026-11-27')).toEqual({
      ok: true,
      value: { type: 'SPECIFIC_DATES', dates: ['2026-11-27', '2026-11-28'] },
    });
  });
});

function occurrence(overrides: Partial<HabitOccurrence> = {}): HabitOccurrence {
  return {
    id: 'occ-1',
    userId: 'u',
    habitId: 'h',
    gameDate: '2026-11-13',
    status: 'PENDING',
    habitName: 'Leer',
    categoryId: 'READING',
    targetQuantity: 20,
    unit: 'PAGES',
    mateLeavesReward: 10,
    xpReward: 20,
    resolvedAt: null,
    resolutionSource: null,
    resolutionSeq: 0,
    ...overrides,
  };
}

describe('decideMark (RN-DAY-03, RN-DAY-05, INT-01)', () => {
  const base = { outcome: 'COMPLETED' as const, currentGameDate: '2026-11-13', dayClosed: false, hpHalfUnits: 20 };

  it('cumplido: +Hojas +XP con la clave habit-reward:<id>:<seq>', () => {
    expect(decideMark({ ...base, occurrence: occurrence() })).toEqual({
      ok: true,
      effects: { status: 'COMPLETED', resolutionSeq: 1, leavesDelta: 10, xpDelta: 20, rewardKey: 'habit-reward:occ-1:1' },
    });
  });

  it('incumplido: sin Hojas ni XP', () => {
    const decision = decideMark({ ...base, outcome: 'MISSED', occurrence: occurrence() });
    expect(decision).toEqual({
      ok: true,
      effects: { status: 'MISSED', resolutionSeq: 1, leavesDelta: 0, xpDelta: 0, rewardKey: null },
    });
  });

  it('ESC-01: una ocurrencia ya marcada no se vuelve a acreditar', () => {
    expect(decideMark({ ...base, occurrence: occurrence({ status: 'COMPLETED', resolvedAt: 'x', resolutionSeq: 1 }) })).toEqual({
      ok: false,
      error: 'ALREADY_RESOLVED',
    });
  });

  it('tras deshacer, el siguiente marcado usa otra clave (seq 2)', () => {
    const decision = decideMark({ ...base, occurrence: occurrence({ resolutionSeq: 1 }) });
    expect(decision.ok && decision.effects.rewardKey).toBe('habit-reward:occ-1:2');
  });

  it('ESC-03 / ESC-04: viernes 13 a las 02:30 del sábado sí; a las 04:01 no', () => {
    const at0230 = getGameDate(new Date(2026, 10, 14, 2, 30));
    const at0401 = getGameDate(new Date(2026, 10, 14, 4, 1));
    expect(decideMark({ ...base, currentGameDate: at0230, occurrence: occurrence() }).ok).toBe(true);
    expect(decideMark({ ...base, currentGameDate: at0401, occurrence: occurrence() })).toEqual({
      ok: false,
      error: 'DAY_CLOSED',
    });
  });

  it('jornada cerrada con Día Finalizado o a 0 HP → rechazado', () => {
    expect(decideMark({ ...base, dayClosed: true, occurrence: occurrence() })).toEqual({ ok: false, error: 'DAY_CLOSED' });
    expect(decideMark({ ...base, hpHalfUnits: 0, occurrence: occurrence() })).toEqual({ ok: false, error: 'ZERO_HP' });
    expect(decideMark({ ...base, hpHalfUnits: 1, occurrence: occurrence() }).ok).toBe(true);
  });
});

describe('decideUndo (RN-DAY-07, ESC-24)', () => {
  const resolvedAt = '2026-11-13T15:00:00.000Z';
  const completed = occurrence({ status: 'COMPLETED', resolvedAt, resolutionSource: 'USER', resolutionSeq: 1 });
  const ctx = (seconds: number) => ({
    occurrence: completed,
    now: new Date(new Date(resolvedAt).getTime() + seconds * 1000),
    currentGameDate: '2026-11-13',
    dayClosed: false,
    mateLeavesBalance: 10,
  });

  it('a los 5 s revierte Hojas y XP con la clave undo:<id>:<seq>', () => {
    expect(decideUndo(ctx(5))).toEqual({
      ok: true,
      effects: { leavesDelta: -10, xpDelta: -20, reversalKey: 'undo:occ-1:1' },
    });
  });

  it('límite: a los 10 s exactos sí; a los 10,001 s y a los 15 s no', () => {
    expect(decideUndo(ctx(10)).ok).toBe(true);
    expect(decideUndo(ctx(10.001))).toEqual({ ok: false, error: 'WINDOW_EXPIRED' });
    expect(decideUndo(ctx(15))).toEqual({ ok: false, error: 'WINDOW_EXPIRED' });
  });

  it('deshacer dos veces: la segunda no tiene nada que deshacer', () => {
    expect(decideUndo({ ...ctx(5), occurrence: occurrence({ resolutionSeq: 1 }) })).toEqual({
      ok: false,
      error: 'NOT_RESOLVED',
    });
  });

  it('lo marcado por el cierre no se deshace aquí; tampoco si ya se gastaron las Hojas', () => {
    expect(decideUndo({ ...ctx(5), occurrence: { ...completed, resolutionSource: 'DAY_CLOSE' } })).toEqual({
      ok: false,
      error: 'NOT_UNDOABLE',
    });
    expect(decideUndo({ ...ctx(5), mateLeavesBalance: 5 })).toEqual({ ok: false, error: 'INSUFFICIENT_BALANCE' });
  });

  it('deshacer un incumplido no mueve saldos', () => {
    const missed = { ...completed, status: 'MISSED' as const };
    expect(decideUndo({ ...ctx(5), occurrence: missed })).toEqual({
      ok: true,
      effects: { leavesDelta: 0, xpDelta: 0, reversalKey: null },
    });
  });
});

describe('applyBalanceDeltas (RN-XP-02, INT-05)', () => {
  it('recalcula el nivel desde la XP: 90 + 10 = 100 → nivel 1', () => {
    expect(applyBalanceDeltas({ mateLeavesBalance: 0, xpTotal: 90 }, 5, 10)).toEqual({
      mateLeavesBalance: 5,
      xpTotal: 100,
      level: 1,
    });
  });

  it('nunca deja saldos negativos', () => {
    expect(() => applyBalanceDeltas({ mateLeavesBalance: 5, xpTotal: 0 }, -10, 0)).toThrow(RangeError);
  });
});
