import { getGameDate } from './gameDay';

/** Crea un instante en hora local (como el reloj del teléfono). */
function localTime(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

describe('getGameDate — RN-DAY-01 (la jornada termina a las 04:00)', () => {
  it('03:59 pertenece a la jornada anterior (límite)', () => {
    expect(getGameDate(localTime(2026, 11, 27, 3, 59))).toBe('2026-11-26');
  });

  it('04:00 ya es la jornada nueva (límite)', () => {
    expect(getGameDate(localTime(2026, 11, 27, 4, 0))).toBe('2026-11-27');
  });

  it('00:00 pertenece a la jornada anterior', () => {
    expect(getGameDate(localTime(2026, 11, 27, 0, 0))).toBe('2026-11-26');
  });

  it('23:59 pertenece a su propia jornada', () => {
    expect(getGameDate(localTime(2026, 11, 26, 23, 59))).toBe('2026-11-26');
  });

  it('cruza el cambio de mes', () => {
    expect(getGameDate(localTime(2026, 12, 1, 2, 30))).toBe('2026-11-30');
  });

  it('cruza el cambio de año', () => {
    expect(getGameDate(localTime(2027, 1, 1, 3, 0))).toBe('2026-12-31');
  });

  it('es determinista: el mismo instante da siempre la misma jornada', () => {
    const now = localTime(2026, 11, 27, 3, 59);
    expect(getGameDate(now)).toBe(getGameDate(now));
  });
});
