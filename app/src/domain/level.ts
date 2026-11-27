import { LEVEL_CURVE } from '@/config/game';

/**
 * Niveles (RN-XP-02, P-03). El nivel se DERIVA de la XP total; nunca se guarda
 * por separado como fuente de verdad.
 *
 * XP total para llegar al nivel n = 40·n² + 60·n
 *   nivel 1 = 100 · nivel 2 = 280 · nivel 5 = 1.300 · nivel 10 = 4.600
 * Paso del nivel n−1 al n = 80·n + 20.
 */

function assertValidXp(xpTotal: number): void {
  if (!Number.isInteger(xpTotal) || xpTotal < 0) {
    throw new RangeError(`XP inválida: ${xpTotal}. Debe ser un entero ≥ 0.`);
  }
}

/** XP total necesaria para alcanzar `level`. */
export function xpRequiredForLevel(level: number): number {
  return LEVEL_CURVE.a * level * level + LEVEL_CURVE.b * level;
}

/** Nivel alcanzado con `xpTotal` (nivel inicial 0, sin máximo). */
export function levelFromXp(xpTotal: number): number {
  assertValidXp(xpTotal);
  let level = 0;
  while (xpRequiredForLevel(level + 1) <= xpTotal) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP ganada dentro del nivel actual. */
  xpIntoLevel: number;
  /** XP que separa el nivel actual del siguiente (paso). */
  xpForNextLevel: number;
  /** XP que falta para subir. */
  xpToNextLevel: number;
}

/** Datos de la barra de XP del HUD (RN-NAV-02). */
export function getLevelProgress(xpTotal: number): LevelProgress {
  const level = levelFromXp(xpTotal);
  const levelStart = xpRequiredForLevel(level);
  const nextLevelStart = xpRequiredForLevel(level + 1);
  return {
    level,
    xpIntoLevel: xpTotal - levelStart,
    xpForNextLevel: nextLevelStart - levelStart,
    xpToNextLevel: nextLevelStart - xpTotal,
  };
}
