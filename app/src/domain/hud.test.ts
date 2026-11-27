import { MAX_HP_HALF_UNITS } from '@/config/game';

import { formatHpLabel, getHeartStates, TOTAL_HEARTS } from './hp';
import { getLevelProgress, levelFromXp, xpRequiredForLevel } from './level';

describe('getHeartStates (RN-NAV-02, INT-03)', () => {
  it('representa bien las 21 posibilidades (0 a 20 unidades)', () => {
    for (let units = 0; units <= MAX_HP_HALF_UNITS; units += 1) {
      const hearts = getHeartStates(units);
      expect(hearts).toHaveLength(TOTAL_HEARTS);
      expect(hearts.filter((h) => h === 'FULL')).toHaveLength(Math.floor(units / 2));
      expect(hearts.filter((h) => h === 'HALF')).toHaveLength(units % 2);
      // Orden: llenos, después el medio (si hay) y al final los vacíos.
      const order = hearts.map((h) => ({ FULL: 0, HALF: 1, EMPTY: 2 })[h]);
      expect([...order].sort()).toEqual(order);
    }
  });

  it('límites: 0 unidades = 10 vacíos; 20 = 10 llenos; 15 = 7 llenos + 1 medio', () => {
    expect(getHeartStates(0)).toEqual(Array(10).fill('EMPTY'));
    expect(getHeartStates(20)).toEqual(Array(10).fill('FULL'));
    expect(getHeartStates(15)).toEqual([...Array(7).fill('FULL'), 'HALF', 'EMPTY', 'EMPTY']);
  });

  it('rechaza valores fuera de 0..20 o no enteros', () => {
    expect(() => getHeartStates(-1)).toThrow(RangeError);
    expect(() => getHeartStates(21)).toThrow(RangeError);
    expect(() => getHeartStates(2.5)).toThrow(RangeError);
  });

  it('formatHpLabel usa coma decimal', () => {
    expect(formatHpLabel(15)).toBe('HP 7,5 de 10');
    expect(formatHpLabel(20)).toBe('HP 10 de 10');
    expect(formatHpLabel(0)).toBe('HP 0 de 10');
  });
});

describe('niveles (RN-XP-02, P-03)', () => {
  it('curva 40·n² + 60·n: nivel 1 = 100, 5 = 1.300, 10 = 4.600, 20 = 17.200', () => {
    expect(xpRequiredForLevel(0)).toBe(0);
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(5)).toBe(1300);
    expect(xpRequiredForLevel(10)).toBe(4600);
    expect(xpRequiredForLevel(20)).toBe(17200);
  });

  it('límites de subida: 99 → 0, 100 → 1, 279 → 1, 280 → 2', () => {
    expect(levelFromXp(0)).toBe(0);
    expect(levelFromXp(99)).toBe(0);
    expect(levelFromXp(100)).toBe(1);
    expect(levelFromXp(279)).toBe(1);
    expect(levelFromXp(280)).toBe(2);
    expect(levelFromXp(17200)).toBe(20);
  });

  it('progreso de la barra: con 150 XP, nivel 1 y 50 de 180', () => {
    expect(getLevelProgress(150)).toEqual({ level: 1, xpIntoLevel: 50, xpForNextLevel: 180, xpToNextLevel: 130 });
    expect(getLevelProgress(0)).toEqual({ level: 0, xpIntoLevel: 0, xpForNextLevel: 100, xpToNextLevel: 100 });
  });

  it('rechaza XP negativa o no entera', () => {
    expect(() => levelFromXp(-1)).toThrow(RangeError);
    expect(() => levelFromXp(1.5)).toThrow(RangeError);
  });
});
