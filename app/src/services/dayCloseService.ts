import { findChallengeByOccurrence, deletePendingChallengeOfOccurrence } from '@/database/repositories/challengesRepository';
import {
  deleteManualSummary,
  findLastClosedDate,
  findSummary,
  insertSummary,
  isDayClosed,
} from '@/database/repositories/dailySummariesRepository';
import { abandonStaleMissions } from '@/database/repositories/missionsRepository';
import { getLastMood } from '@/database/repositories/moodRepository';
import {
  closePendingOccurrences,
  listOccurrencesForDate,
  reopenDayCloseOccurrences,
} from '@/database/repositories/occurrencesRepository';
import { getPlayerProfile, updateCloseState } from '@/database/repositories/playerProfilesRepository';
import { findUserCreatedAt } from '@/database/repositories/usersRepository';
import { runInTransaction } from '@/database/transaction';
import { pickCloseMessageId } from '@/content/dayTexts';
import {
  challengeCreatedAtForClose,
  datesToClose,
  DAY_CLOSE_ERROR_MESSAGES,
  decideDayClose,
  decideUndoDayClose,
} from '@/domain/dayClose';
import { getGameDate } from '@/domain/gameDay';
import type { CloseSource, DailySummary, GameDate } from '@/domain/types';

import { createMissedHabitChallenge } from './challengeService';
import type { AppDeps } from './deps';
import { ensureOccurrencesForDate } from './occurrenceService';

/**
 * Cierre de jornada (RN-CLOSE-01..09). Cada caso de uso es UNA transacción
 * e idempotente: UNIQUE(user_id, game_date) impide cerrar dos veces (INT-09).
 */

/**
 * Cierra UNA jornada DENTRO de una transacción ya abierta (RN-CLOSE-02):
 * (1) programadas, (2) cumplidas, (3) pendientes → incumplidas (o en pausa a 0 HP),
 * (4) desafíos, (7–9) porcentaje, clasificación y racha, (10) mensaje.
 * Los pasos 5 y 6 (vencimientos y pérdidas) los hace la reconciliación de desafíos.
 * Devuelve null si ya estaba cerrada.
 */
async function closeDayInTransaction(
  deps: AppDeps,
  userId: string,
  gameDate: GameDate,
  source: CloseSource,
  now: Date,
): Promise<DailySummary | null> {
  if (await isDayClosed(deps.db, userId, gameDate)) return null;
  const profile = await getPlayerProfile(deps.db, userId);
  if (!profile) return null;
  const nowIso = now.toISOString();

  // Paso 1: con el horizonte de 0 días (R-26), una jornada en la que no se abrió la app no tiene filas.
  await ensureOccurrencesForDate(deps, userId, gameDate);
  const occurrences = await listOccurrencesForDate(deps.db, userId, gameDate);
  const decision = decideDayClose({ occurrences, hpHalfUnits: profile.hpHalfUnits, streakBefore: profile.perfectStreak });

  await closePendingOccurrences(deps.db, { userId, gameDate, ids: decision.pendingIds, to: decision.pendingTo, now: nowIso });
  if (!decision.paused) {
    // Paso 4 (RN-DAY-04, RN-DES-09): un desafío por cada incumplida del cierre.
    const createdAt = challengeCreatedAtForClose(gameDate, source, now);
    for (const occurrence of occurrences.filter((o) => decision.pendingIds.includes(o.id))) {
      await createMissedHabitChallenge(deps, { ...occurrence, status: 'MISSED' }, createdAt);
    }
  }

  const summary: DailySummary = {
    id: deps.crypto.randomUUID(),
    userId,
    gameDate,
    scheduledCount: decision.scheduledCount,
    completedCount: decision.completedCount,
    missedCount: decision.missedCount,
    classification: decision.classification,
    lastMood: await getLastMood(deps.db, userId, gameDate), // RN-MAP-08
    streakBefore: decision.streakBefore,
    streakAfter: decision.streakAfter,
    messageId: pickCloseMessageId(decision.classification, gameDate),
    closeSource: source,
    closedAt: nowIso,
  };
  if (!(await insertSummary(deps.db, summary))) throw new Error('La jornada ya estaba cerrada.');
  await updateCloseState(deps.db, { userId, perfectStreak: decision.streakAfter, lastClosedGameDate: gameDate, now: nowIso });
  return summary;
}

export type CloseDayResult = { ok: true; summary: DailySummary } | { ok: false; error: string };

/** Día Finalizado (`closeGameDay({ source: 'MANUAL' })`): cierra la jornada actual. */
export async function closeGameDay(deps: AppDeps, userId: string): Promise<CloseDayResult> {
  const now = deps.now();
  const gameDate = getGameDate(now);
  return runInTransaction(deps.db, async (): Promise<CloseDayResult> => {
    const summary = await closeDayInTransaction(deps, userId, gameDate, 'MANUAL', now);
    if (!summary) return { ok: false, error: DAY_CLOSE_ERROR_MESSAGES.ALREADY_CLOSED };
    return { ok: true, summary };
  });
}

/**
 * Reconciliación, paso 1 (RN-CLOSE-01, RN-CLOSE-04, ESC-13): cierra en orden
 * cronológico cada jornada pendiente hasta ayer (cierre AUTO) y abandona las
 * misiones aceptadas de jornadas terminadas (P-58). Idempotente.
 */
export async function closePendingDays(deps: AppDeps, userId: string): Promise<number> {
  const now = deps.now();
  const today = getGameDate(now);
  return runInTransaction(deps.db, async () => {
    const createdAt = await findUserCreatedAt(deps.db, userId);
    if (!createdAt) return 0;
    const lastClosed = await findLastClosedDate(deps.db, userId);
    let closed = 0;
    for (const gameDate of datesToClose(lastClosed, getGameDate(new Date(createdAt)), today)) {
      if (await closeDayInTransaction(deps, userId, gameDate, 'AUTO', now)) closed += 1;
    }
    await abandonStaleMissions(deps.db, userId, today);
    return closed;
  });
}

export type UndoCloseResult = { ok: true } | { ok: false; error: string };

/**
 * Deshacer Día Finalizado (RN-CLOSE-09, INT-19): solo el cierre MANUAL de la
 * jornada actual y antes de las 04:00. Revierte únicamente lo que hizo el cierre.
 */
export async function undoDayClose(deps: AppDeps, userId: string): Promise<UndoCloseResult> {
  const now = deps.now();
  const nowIso = now.toISOString();
  return runInTransaction(deps.db, async (): Promise<UndoCloseResult> => {
    // La última jornada cerrada: si no es la actual, la ventana ya pasó (lo decide el dominio).
    const gameDate = await findLastClosedDate(deps.db, userId);
    if (!gameDate) return { ok: false, error: DAY_CLOSE_ERROR_MESSAGES.NOT_CLOSED };
    const summary = await findSummary(deps.db, userId, gameDate);
    const closedByDay = (await listOccurrencesForDate(deps.db, userId, gameDate)).filter(
      (o) => o.resolutionSource === 'DAY_CLOSE',
    );
    const challenges = await Promise.all(closedByDay.map((o) => findChallengeByOccurrence(deps.db, o.id)));
    const decision = decideUndoDayClose({
      summary,
      now,
      closeChallengesResolved: challenges.some((c) => c !== null && c.status !== 'PENDING'),
    });
    if (!decision.ok || !summary) return { ok: false, error: DAY_CLOSE_ERROR_MESSAGES[decision.ok ? 'NOT_CLOSED' : decision.error] };

    for (const occurrence of closedByDay) await deletePendingChallengeOfOccurrence(deps.db, occurrence.id);
    await reopenDayCloseOccurrences(deps.db, { userId, gameDate, now: nowIso });
    // decideUndoDayClose ya comprobó que es MANUAL; si aun así no se borra, se revierte todo.
    if (!(await deleteManualSummary(deps.db, userId, gameDate))) throw new Error('No se pudo deshacer el cierre.');
    await updateCloseState(deps.db, {
      userId,
      perfectStreak: summary.streakBefore,
      lastClosedGameDate: await findLastClosedDate(deps.db, userId),
      now: nowIso,
    });
    return { ok: true };
  });
}

/** Resumen de la jornada actual (Inicio lo usa para el mensaje de cierre y el botón Deshacer). */
export async function findTodaySummary(deps: AppDeps, userId: string): Promise<DailySummary | null> {
  return findSummary(deps.db, userId, getGameDate(deps.now()));
}
