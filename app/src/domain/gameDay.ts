import { DAY_CUTOFF_HOUR } from '@/config/game';

import type { GameDate } from './types';

/**
 * Devuelve la fecha de jornada de un instante (RN-DAY-01, R-08).
 *
 * La jornada termina a las 04:00 hora del teléfono: lo registrado entre las
 * 00:00 y las 03:59 pertenece al día anterior. Función pura: el reloj se
 * inyecta (`now`), nunca se llama a `new Date()` aquí.
 */
export function getGameDate(now: Date, cutoffHour: number = DAY_CUTOFF_HOUR): GameDate {
  const local = new Date(now.getTime());
  if (local.getHours() < cutoffHour) {
    // setDate gestiona el cambio de mes y de año (1 de enero → 31 de diciembre).
    local.setDate(local.getDate() - 1);
  }
  return formatLocalDate(local);
}

/** 'YYYY-MM-DD' con la fecha local (no UTC) del instante dado. */
export function formatLocalDate(date: Date): GameDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
