import { monthGrid, monthRange, shiftMonth } from './calendar';
import {
  classifyDay,
  closeAtOf,
  completionPercent,
  datesToClose,
  decideDayClose,
  decideUndoDayClose,
  nextStreak,
} from './dayClose';

describe('classifyDay (RN-MAP-02..04, C-14, ESC-15)', () => {
  it.each([
    [20, 20, 'PERFECT'],
    [17, 20, 'VERY_GOOD'], // 85 % exacto
    [8, 20, 'PARTIAL'], // 40 % exacto
    [7, 20, 'CRITICAL'], // 35 %
    [11, 13, 'PARTIAL'], // 84,6 %: sin redondear NO es Muy bueno
    [0, 3, 'CRITICAL'],
  ] as const)('%i de %i → %s', (completed, scheduled, expected) => {
    expect(classifyDay(completed, scheduled)).toBe(expected);
  });

  it('ESC-14: sin hábitos programados → NO_ACTIVITY, nunca Perfecto', () => {
    expect(classifyDay(0, 0)).toBe('NO_ACTIVITY');
    expect(completionPercent(0, 0)).toBeNull();
  });
});

describe('nextStreak (RN-CLOSE-07, P-30)', () => {
  it('Perfecto suma; sin actividades y en pausa se saltan; el resto rompe', () => {
    expect(nextStreak(2, 'PERFECT')).toBe(3);
    expect(nextStreak(2, 'NO_ACTIVITY')).toBe(2);
    expect(nextStreak(2, 'PAUSED')).toBe(2);
    expect(nextStreak(2, 'VERY_GOOD')).toBe(0);
    expect(nextStreak(2, 'CRITICAL')).toBe(0);
  });
});

describe('closeAtOf y datesToClose (ARCHITECTURE.md §8, RN-CLOSE-04)', () => {
  it('la jornada D cierra el día D+1 a las 04:00 locales (cambio de mes y de año)', () => {
    expect(closeAtOf('2026-11-30')).toEqual(new Date(2026, 11, 1, 4, 0, 0));
    expect(closeAtOf('2026-12-31')).toEqual(new Date(2027, 0, 1, 4, 0, 0));
  });

  it('cierra en orden desde la siguiente a la última cerrada hasta AYER', () => {
    expect(datesToClose('2026-11-25', '2026-11-01', '2026-11-28')).toEqual(['2026-11-26', '2026-11-27']);
    expect(datesToClose(null, '2026-11-27', '2026-11-28')).toEqual(['2026-11-27']);
    expect(datesToClose('2026-11-28', '2026-11-01', '2026-11-28')).toEqual([]); // hoy ya cerrado a mano
  });
});

describe('decideDayClose (RN-CLOSE-02, P-50)', () => {
  const occurrences = [
    { id: 'a', status: 'COMPLETED' as const },
    { id: 'b', status: 'PENDING' as const },
    { id: 'c', status: 'MISSED' as const },
    { id: 'd', status: 'CANCELLED' as const },
  ];

  it('las pendientes pasan a incumplidas; las canceladas no cuentan', () => {
    expect(decideDayClose({ occurrences, hpHalfUnits: 10, streakBefore: 4 })).toEqual({
      paused: false,
      pendingIds: ['b'],
      pendingTo: 'MISSED',
      scheduledCount: 3,
      completedCount: 1,
      missedCount: 2,
      classification: 'CRITICAL',
      streakBefore: 4,
      streakAfter: 0,
    });
  });

  it('RN-MAP-09: a 0 HP la jornada queda en pausa; las pendientes pasan a PAUSED y la racha se salta', () => {
    expect(decideDayClose({ occurrences, hpHalfUnits: 0, streakBefore: 4 })).toMatchObject({
      paused: true,
      pendingIds: ['b'],
      pendingTo: 'PAUSED',
      missedCount: 1,
      classification: 'PAUSED',
      streakAfter: 4,
    });
  });

  it('límite de HP: con 1 unidad la jornada NO está en pausa', () => {
    expect(decideDayClose({ occurrences, hpHalfUnits: 1, streakBefore: 0 }).paused).toBe(false);
  });
});

describe('decideUndoDayClose (RN-CLOSE-09, C-29)', () => {
  const summary = { gameDate: '2026-11-27', closeSource: 'MANUAL' as const };

  it('03:59 del día siguiente: se puede; 04:00: ya no', () => {
    expect(decideUndoDayClose({ summary, now: new Date(2026, 10, 28, 3, 59, 59), closeChallengesResolved: false })).toEqual({
      ok: true,
    });
    expect(decideUndoDayClose({ summary, now: new Date(2026, 10, 28, 4, 0, 0), closeChallengesResolved: false })).toEqual({
      ok: false,
      error: 'WINDOW_EXPIRED',
    });
  });

  it('un cierre automático no se deshace; tampoco si un desafío del cierre ya se completó', () => {
    const now = new Date(2026, 10, 27, 23, 0, 0);
    expect(decideUndoDayClose({ summary: { ...summary, closeSource: 'AUTO' }, now, closeChallengesResolved: false })).toEqual({
      ok: false,
      error: 'NOT_MANUAL',
    });
    expect(decideUndoDayClose({ summary, now, closeChallengesResolved: true })).toEqual({
      ok: false,
      error: 'CHALLENGE_RESOLVED',
    });
    expect(decideUndoDayClose({ summary: null, now, closeChallengesResolved: false })).toEqual({ ok: false, error: 'NOT_CLOSED' });
  });
});

describe('calendario del Mapa (RN-MAP-01)', () => {
  it('noviembre de 2026 empieza en domingo: 6 huecos antes del día 1 y semanas de 7', () => {
    const weeks = monthGrid(2026, 10);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(monthRange(2026, 1)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
  });
});
