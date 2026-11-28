import { reconcileChallenges, refreshChallenges } from './challengeService';
import { closePendingDays } from './dayCloseService';
import type { AppDeps } from './deps';
import { refreshToday } from './occurrenceService';

/**
 * Reconciliación (ARCHITECTURE.md §8): al abrir la app, al volver al primer
 * plano y al entrar en Inicio o Desafíos. Idempotente: ejecutarla de más no
 * produce efectos dobles. Orden:
 *
 * 1. Cierra en orden las jornadas pendientes hasta ayer (RN-CLOSE-04).
 * 2. Gracia de 12 h a los desafíos vencidos con la app cerrada (RN-DES-10).
 * 3. Vencimientos: −1 unidad y desafío de recuperación (RN-HP-03, RN-HP-06).
 *
 * `appOpened = true`: la app viene de estar cerrada o en segundo plano.
 */

/** Usuarios ya reconciliados en este proceso (se pierde al cerrar la app). */
const reconciledUsers = new Set<string>();
/** Cola: dos reconciliaciones nunca se intercalan. */
let queue: Promise<void> = Promise.resolve();

export function reconcile(deps: AppDeps, userId: string, options: { appOpened: boolean }): Promise<void> {
  const run = queue.then(async () => {
    // La PRIMERA reconciliación de la cuenta tras arrancar la app siempre cuenta
    // como apertura: así la gracia no depende de qué pantalla llame antes (INT-18).
    const appOpened = options.appOpened || !reconciledUsers.has(userId);
    reconciledUsers.add(userId);
    await closePendingDays(deps, userId);
    await reconcileChallenges(deps, userId, { appOpened });
    await refreshToday(deps, userId);
    await refreshChallenges(deps, userId);
  });
  queue = run.catch(() => undefined);
  return run;
}
