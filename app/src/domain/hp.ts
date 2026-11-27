import { HALF_UNITS_PER_HEART, MAX_HP_HALF_UNITS, MIN_HP_HALF_UNITS } from '@/config/game';

import type { HpHalfUnits } from './types';

/** Estado de cada corazón del HUD (RN-NAV-02: lleno, medio o vacío). */
export type HeartState = 'FULL' | 'HALF' | 'EMPTY';

function assertValidUnits(units: HpHalfUnits): void {
  // INT-03: 0 ≤ unidades ≤ 20 siempre. Si no se cumple, es un error del programa.
  if (!Number.isInteger(units) || units < MIN_HP_HALF_UNITS || units > MAX_HP_HALF_UNITS) {
    throw new RangeError(`HP inválido: ${units} unidades (debe estar entre 0 y 20).`);
  }
}

/** Unidades internas (0..20) → corazones mostrados (0..10, en pasos de 0,5). R-01. */
export function halfUnitsToHearts(units: HpHalfUnits): number {
  return units / HALF_UNITS_PER_HEART;
}

/** Número de corazones del HUD (10). */
export const TOTAL_HEARTS = MAX_HP_HALF_UNITS / HALF_UNITS_PER_HEART;

/**
 * Los diez corazones del HUD, de izquierda a derecha (RN-NAV-02).
 * Ej.: 15 unidades → 7 llenos, 1 medio y 2 vacíos.
 */
export function getHeartStates(units: HpHalfUnits): HeartState[] {
  assertValidUnits(units);
  return Array.from({ length: TOTAL_HEARTS }, (_, index): HeartState => {
    const remaining = units - index * HALF_UNITS_PER_HEART;
    if (remaining >= HALF_UNITS_PER_HEART) return 'FULL';
    if (remaining > 0) return 'HALF';
    return 'EMPTY';
  });
}

/** Texto accesible y visible del HP, con coma decimal: "HP 7,5 de 10". */
export function formatHpLabel(units: HpHalfUnits): string {
  assertValidUnits(units);
  const hearts = String(halfUnitsToHearts(units)).replace('.', ',');
  return `HP ${hearts} de ${TOTAL_HEARTS}`;
}
