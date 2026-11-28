import { reconcileChallenges, refreshChallenges } from './challengeService';
import type { AppDeps } from './deps';
import { refreshToday } from './occurrenceService';

/**
 * Reconciliación (ARCHITECTURE.md §8): al abrir la app, al volver al primer
 * plano y al entrar en Inicio o Desafíos. Idempotente: ejecutarla de más no
 * produce efectos dobles.
 *
 * - `appOpened = true`: la app viene de estar cerrada o en segundo plano; los
 *   desafíos vencidos en ese tiempo reciben la gracia de 12 h (RN-DES-10).
 * - La Fase 9 añadirá aquí el cierre de las jornadas pendientes (paso 1).
 */
export async function reconcile(deps: AppDeps, userId: string, options: { appOpened: boolean }): Promise<void> {
  await reconcileChallenges(deps, userId, options);
  await refreshToday(deps, userId);
  await refreshChallenges(deps, userId);
}
