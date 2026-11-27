import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { OccurrenceCard } from '@/components/OccurrenceCard';
import { PixelButton } from '@/components/PixelButton';
import { UndoBar } from '@/components/UndoBar';
import { UNDO_WINDOW_SECONDS } from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import { formatGameDateShort } from '@/content/habitTexts';
import type { MarkOutcome } from '@/domain/habitMarking';
import type { HabitCategory } from '@/domain/types';
import { listHabitCategories } from '@/services/onboardingService';
import { markOccurrence, refreshToday, undoMark } from '@/services/occurrenceService';
import { useAppDeps } from '@/services/useAppDeps';
import { useHabitsStore } from '@/state/useHabitsStore';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useSessionStore } from '@/state/useSessionStore';

const TICK_MS = 500;
const ZERO_HP_REASON = 'Sin vidas no puedes marcar hábitos. Completa un desafío de recuperación.';

/** Inicio: Misiones del día (RN-DAY-08) con marcado y deshacer en 10 s (RN-DAY-07). */
export function HomeScreen() {
  const deps = useAppDeps();
  const userId = useSessionStore((s) => s.user?.id);
  const gameDate = useHabitsStore((s) => s.gameDate);
  const occurrences = useHabitsStore((s) => s.todayOccurrences);
  const hpHalfUnits = usePlayerStore((s) => s.profile?.hpHalfUnits);

  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastMarkedId, setLastMarkedId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Recarga al entrar en la pestaña: si pasaron las 04:00, cambia la jornada.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      refreshToday(deps, userId).catch(() => setError('No se pudieron cargar tus misiones.'));
    }, [deps, userId]),
  );

  useEffect(() => {
    listHabitCategories(deps.db).then(setCategories).catch(() => undefined);
  }, [deps.db]);

  // Cuenta atrás del aviso de deshacer.
  const lastMarked = occurrences.find((o) => o.id === lastMarkedId && o.status !== 'PENDING');
  const elapsedSeconds = lastMarked?.resolvedAt
    ? (deps.now().getTime() - new Date(lastMarked.resolvedAt).getTime()) / 1000
    : Infinity;
  const secondsLeft = Math.ceil(UNDO_WINDOW_SECONDS - elapsedSeconds);
  const showUndo = lastMarked !== undefined && secondsLeft > 0;

  useEffect(() => {
    if (!showUndo) return;
    const timer = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(timer);
  }, [showUndo]);

  if (!userId) return null;
  const currentUserId = userId;

  async function handleMark(occurrenceId: string, outcome: MarkOutcome) {
    setBusyId(occurrenceId);
    setError(null);
    try {
      const result = await markOccurrence(deps, currentUserId, occurrenceId, outcome);
      if (result.ok) setLastMarkedId(occurrenceId);
      else setError(result.error);
      await refreshToday(deps, currentUserId);
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleUndo() {
    if (!lastMarked) return;
    setUndoing(true);
    try {
      const result = await undoMark(deps, currentUserId, lastMarked.id);
      if (!result.ok) setError(result.error);
      setLastMarkedId(null);
      await refreshToday(deps, currentUserId);
    } catch {
      setError('No se pudo deshacer. Inténtalo de nuevo.');
    } finally {
      setUndoing(false);
    }
  }

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';
  const disabledReason = hpHalfUnits === 0 ? ZERO_HP_REASON : undefined;
  const done = occurrences.filter((o) => o.status === 'COMPLETED').length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.title} accessibilityRole="header">
              Misiones del día
            </Text>
            {gameDate ? (
              <Text style={styles.subtitle}>
                {formatGameDateShort(gameDate)}
                {occurrences.length > 0 ? ` · ${done} de ${occurrences.length} cumplidas` : ''}
              </Text>
            ) : null}
          </View>
          <PixelButton label="Mis hábitos" variant="secondary" onPress={() => router.push('/habits')} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {occurrences.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>Sin actividades programadas</Text>
            <Text style={styles.hint}>Crea un hábito y asígnalo a días para verlo aquí.</Text>
            <PixelButton label="Crear un hábito" onPress={() => router.push('/habit-form')} />
          </View>
        ) : (
          occurrences.map((occurrence) => (
            <OccurrenceCard
              key={occurrence.id}
              occurrence={occurrence}
              categoryName={categoryName(occurrence.categoryId)}
              disabledReason={disabledReason}
              busy={busyId === occurrence.id}
              onComplete={() => handleMark(occurrence.id, 'COMPLETED')}
              onMiss={() => handleMark(occurrence.id, 'MISSED')}
            />
          ))
        )}
      </ScrollView>

      {showUndo && lastMarked ? (
        <View style={styles.undoWrapper}>
          <UndoBar
            message={
              lastMarked.status === 'COMPLETED'
                ? `¡${lastMarked.habitName} cumplido! +${lastMarked.mateLeavesReward} Hojas +${lastMarked.xpReward} XP`
                : `${lastMarked.habitName}: no cumplido`
            }
            secondsLeft={secondsLeft}
            onUndo={handleUndo}
            busy={undoing}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  title: { color: colors.navy, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, fontSize: 13 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  empty: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  hint: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
  undoWrapper: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
});
