import {
  challengeDeadline,
  challengeRewards,
  challengeSize,
  decideCompleteChallenge,
  decideExpiry,
  decideGrace,
  timeLeftMs,
  variantForMood,
} from './challenges';
import { decideAcceptMission, decideCompleteMission } from './missions';
import type { Challenge, MoodValue, UserMission } from './types';

const CREATED = new Date('2026-11-27T15:00:00.000Z');
const HOUR = 60 * 60 * 1000;

function challenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'ch-1',
    userId: 'u',
    kind: 'MISSED_HABIT',
    variant: 'NORMAL',
    sourceOccurrenceId: 'occ-1',
    sourceGameDate: '2026-11-27',
    sourcePenaltyId: null,
    habitId: 'h',
    title: 'Leer · 10 páginas',
    targetQuantity: 10,
    unit: 'PAGES',
    status: 'PENDING',
    deadlineAt: challengeDeadline(CREATED).toISOString(),
    graceApplied: false,
    mateLeavesReward: 5,
    xpReward: 4,
    createdAt: CREATED.toISOString(),
    ...overrides,
  };
}

describe('tamaño y recompensa (RN-DES-06, RN-DES-15)', () => {
  it('normal 50 % y mini 10 %, hacia arriba, mínimo 1', () => {
    expect(challengeSize(60, 'NORMAL')).toBe(30);
    expect(challengeSize(60, 'MINI')).toBe(6); // ESC-08
    expect(challengeSize(15, 'NORMAL')).toBe(8);
    expect(challengeSize(1, 'MINI')).toBe(1);
    expect(challengeSize(3, 'MINI')).toBe(1);
  });

  it('½ Hojas hacia abajo y 20 % de la XP (ESC-09, ESC-30)', () => {
    expect(challengeRewards(10, 20)).toEqual({ leaves: 5, xp: 4 });
    expect(challengeRewards(25, 30)).toEqual({ leaves: 12, xp: 6 });
    expect(challengeRewards(5, 50)).toEqual({ leaves: 2, xp: 10 });
    expect(challengeRewards(0, 0)).toEqual({ leaves: 0, xp: 0 });
  });

  it('variante según el último ánimo: los cinco estados y sin registro (RN-MOOD-04..07)', () => {
    const cases: [MoodValue | null, string][] = [
      ['VERY_HAPPY', 'NORMAL'],
      ['GOOD', 'NORMAL'],
      ['NEUTRAL', 'NORMAL'],
      ['DOWN', 'MINI'],
      ['VERY_BAD', 'MINI'],
      [null, 'NORMAL'],
    ];
    for (const [mood, variant] of cases) expect(variantForMood(mood)).toBe(variant);
  });
});

describe('completar (RN-DES-06, RN-DES-08, RN-HP-06, RN-HP-10)', () => {
  it('en plazo: recompensa con la clave challenge-reward:<id> y sin HP', () => {
    expect(decideCompleteChallenge({ challenge: challenge(), now: CREATED, hpHalfUnits: 20 })).toEqual({
      ok: true,
      effects: {
        leavesDelta: 5,
        xpDelta: 4,
        rewardKey: 'challenge-reward:ch-1',
        hpDelta: 0,
        hpReason: null,
        hpKey: null,
        cancelSuper: false,
      },
    });
  });

  it('ESC-19, límite de 72 h: a las 71:59 sí; a las 72:00 exactas no', () => {
    const at = (ms: number) => new Date(CREATED.getTime() + ms);
    expect(decideCompleteChallenge({ challenge: challenge(), now: at(72 * HOUR - 60_000), hpHalfUnits: 20 }).ok).toBe(true);
    expect(decideCompleteChallenge({ challenge: challenge(), now: at(72 * HOUR), hpHalfUnits: 20 })).toEqual({
      ok: false,
      error: 'OVERDUE',
    });
  });

  it('completar dos veces: la segunda se rechaza (INT-01)', () => {
    expect(decideCompleteChallenge({ challenge: challenge({ status: 'COMPLETED' }), now: CREATED, hpHalfUnits: 20 })).toEqual({
      ok: false,
      error: 'NOT_PENDING',
    });
  });

  it('recuperación: +1 unidad (hp-recovery:<id>), sin plazo', () => {
    const recovery = challenge({ kind: 'RECOVERY', variant: null, deadlineAt: null, sourceOccurrenceId: null, sourcePenaltyId: 'p' });
    const decision = decideCompleteChallenge({ challenge: recovery, now: new Date('2030-01-01'), hpHalfUnits: 19 });
    expect(decision.ok && decision.effects).toMatchObject({ hpDelta: 1, hpReason: 'RECOVERY', hpKey: 'hp-recovery:ch-1' });
  });

  it('a 0 HP, completar un desafío por incumplimiento devuelve 1 unidad y cancela el Superdesafío', () => {
    const decision = decideCompleteChallenge({ challenge: challenge(), now: CREATED, hpHalfUnits: 0 });
    expect(decision.ok && decision.effects).toMatchObject({
      hpDelta: 1,
      hpReason: 'ZERO_HP_RECOVERY',
      hpKey: 'hp-zero-recovery:ch-1',
      cancelSuper: true,
    });
  });
});

describe('gracia y vencimiento (RN-DES-07, RN-DES-10, INT-18, R-25)', () => {
  const overdueAt = new Date(CREATED.getTime() + 80 * HOUR);

  it('gracia: vencido y sin gracia → now + 12 h; con gracia ya aplicada o en plazo → nada', () => {
    expect(decideGrace(challenge(), overdueAt)).toEqual(new Date(overdueAt.getTime() + 12 * HOUR));
    expect(decideGrace(challenge({ graceApplied: true }), overdueAt)).toBeNull();
    expect(decideGrace(challenge(), CREATED)).toBeNull();
  });

  it('ESC-11: vencido → −1 unidad con hp-penalty:<occurrenceId> y crea la recuperación', () => {
    expect(decideExpiry(challenge(), overdueAt, 20)).toEqual({
      penaltyKey: 'hp-penalty:occ-1',
      deltaRequested: -1,
      deltaApplied: -1,
      hpAfter: 19,
      createRecovery: true,
    });
  });

  it('a 0 HP: se registra con delta 0 y no crea recuperación (R-25, RN-HP-09)', () => {
    expect(decideExpiry(challenge(), overdueAt, 0)).toMatchObject({ deltaApplied: 0, hpAfter: 0, createRecovery: false });
  });

  it('no vence en plazo, ni si ya estaba completado o vencido; un rechazado (DECLINED) sí vence', () => {
    expect(decideExpiry(challenge(), CREATED, 20)).toBeNull();
    expect(decideExpiry(challenge({ status: 'COMPLETED' }), overdueAt, 20)).toBeNull();
    expect(decideExpiry(challenge({ status: 'EXPIRED' }), overdueAt, 20)).toBeNull();
    expect(decideExpiry(challenge({ status: 'DECLINED' }), overdueAt, 20)).not.toBeNull();
  });

  it('tiempo restante para la cuenta atrás (RN-DES-16)', () => {
    expect(timeLeftMs(challenge(), CREATED)).toBe(72 * HOUR);
    expect(timeLeftMs(challenge(), overdueAt)).toBe(0);
    expect(timeLeftMs(challenge({ deadlineAt: null }), CREATED)).toBeNull();
  });
});

describe('misiones secundarias (RN-MIS-02..06, INT-20)', () => {
  const input = { categoryId: 'EXERCISE', description: ' Caminar ', targetQuantity: 20, unit: 'minutos' };

  it('acepta con la recompensa fija 20/20 copiada', () => {
    expect(decideAcceptMission({ input, activeOrCompletedToday: 2, hpHalfUnits: 20 })).toEqual({
      ok: true,
      value: { categoryId: 'EXERCISE', description: 'Caminar', targetQuantity: 20, unit: 'minutos' },
      reward: { leaves: 20, xp: 20 },
    });
  });

  it('ESC-28: la 4.ª del día se rechaza; a 0 HP también', () => {
    expect(decideAcceptMission({ input, activeOrCompletedToday: 3, hpHalfUnits: 20 })).toEqual({ ok: false, error: 'DAILY_LIMIT' });
    expect(decideAcceptMission({ input, activeOrCompletedToday: 0, hpHalfUnits: 0 })).toEqual({ ok: false, error: 'ZERO_HP' });
  });

  it('valida la descripción, la cantidad y la categoría', () => {
    const result = decideAcceptMission({
      input: { categoryId: 'X', description: '', targetQuantity: 0, unit: '' },
      activeOrCompletedToday: 0,
      hpHalfUnits: 20,
    });
    expect(result.ok === false && result.error === 'INVALID' && Object.keys(result.fields).sort()).toEqual([
      'categoryId',
      'description',
      'targetQuantity',
      'unit',
    ]);
  });

  it('completar: una vez (mission-reward:<id>); no si ya se completó o es de otra jornada', () => {
    const mission: UserMission = {
      id: 'm1',
      userId: 'u',
      gameDate: '2026-11-27',
      categoryId: 'EXERCISE',
      description: 'Caminar',
      targetQuantity: 20,
      unit: 'minutos',
      mateLeavesReward: 20,
      xpReward: 20,
      status: 'ACCEPTED',
    };
    expect(decideCompleteMission({ mission, currentGameDate: '2026-11-27', hpHalfUnits: 20 })).toEqual({
      ok: true,
      effects: { leavesDelta: 20, xpDelta: 20, rewardKey: 'mission-reward:m1' },
    });
    expect(decideCompleteMission({ mission: { ...mission, status: 'COMPLETED' }, currentGameDate: '2026-11-27', hpHalfUnits: 20 }).ok).toBe(false);
    expect(decideCompleteMission({ mission, currentGameDate: '2026-11-28', hpHalfUnits: 20 })).toEqual({ ok: false, error: 'DAY_CLOSED' });
  });
});
