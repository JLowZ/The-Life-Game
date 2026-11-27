import { GOAL_TEXT_MAX_LENGTH, PURPOSE_MAX_LENGTH } from '@/config/game';

import { halfUnitsToHearts } from './hp';
import { validateOnboarding } from './onboarding';

const VALID = {
  purpose: '  Ser más constante  ',
  goals: [{ text: ' Leer 12 libros ', categoryId: 'READING' }],
};

describe('validateOnboarding (RN-AUTH-02)', () => {
  it('acepta propósito y metas válidos y recorta espacios', () => {
    expect(validateOnboarding(VALID)).toEqual({
      ok: true,
      value: { purpose: 'Ser más constante', goals: [{ text: 'Leer 12 libros', categoryId: 'READING' }] },
    });
  });

  it('exige propósito y al menos una meta', () => {
    const result = validateOnboarding({ purpose: '   ', goals: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.purpose).toBeDefined();
      expect(result.errors.goals).toBeDefined();
    }
  });

  it('rechaza una categoría que no existe (P-42)', () => {
    expect(validateOnboarding({ ...VALID, goals: [{ text: 'Algo', categoryId: 'GAMING' }] }).ok).toBe(false);
  });

  it('respeta los máximos de longitud (límite exacto)', () => {
    expect(validateOnboarding({ ...VALID, purpose: 'a'.repeat(PURPOSE_MAX_LENGTH) }).ok).toBe(true);
    expect(validateOnboarding({ ...VALID, purpose: 'a'.repeat(PURPOSE_MAX_LENGTH + 1) }).ok).toBe(false);
    const longGoal = [{ text: 'a'.repeat(GOAL_TEXT_MAX_LENGTH + 1), categoryId: 'ART' }];
    expect(validateOnboarding({ ...VALID, goals: longGoal }).ok).toBe(false);
  });
});

describe('halfUnitsToHearts (R-01)', () => {
  it('convierte los límites 0 y 20 unidades y las medias vidas', () => {
    expect(halfUnitsToHearts(0)).toBe(0);
    expect(halfUnitsToHearts(15)).toBe(7.5);
    expect(halfUnitsToHearts(20)).toBe(10);
  });
});
