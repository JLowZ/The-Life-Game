import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChallengeCard } from '@/components/ChallengeCard';
import { MissionModal } from '@/components/MissionModal';
import { PixelButton } from '@/components/PixelButton';
import { MAX_DAILY_MISSIONS } from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import { formatQuantity } from '@/content/habitTexts';
import { timeLeftMs } from '@/domain/challenges';
import type { MissionInput } from '@/domain/missions';
import type { HabitCategory, HabitCategoryId } from '@/domain/types';
import { completeChallenge, refreshChallenges } from '@/services/challengeService';
import { abandonMission, acceptMission, completeMission, suggestMission } from '@/services/missionService';
import { listHabitCategories } from '@/services/onboardingService';
import { reconcile } from '@/services/reconciliationService';
import { useAppDeps } from '@/services/useAppDeps';
import { useChallengesStore } from '@/state/useChallengesStore';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useSessionStore } from '@/state/useSessionStore';

const TICK_MS = 30_000;

/** Desafíos (RN-DES-01): por incumplimiento, de recuperación y misiones secundarias. */
export function ChallengesScreen() {
  const deps = useAppDeps();
  const userId = useSessionStore((s) => s.user?.id);
  const active = useChallengesStore((s) => s.active);
  const missions = useChallengesStore((s) => s.todayMissions);
  const hpHalfUnits = usePlayerStore((s) => s.profile?.hpHalfUnits);

  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      reconcile(deps, userId, { appOpened: false }).catch(() => setError('No se pudieron cargar tus desafíos.'));
      // La cuenta atrás se actualiza cada 30 s mientras la pantalla está visible.
      const timer = setInterval(() => setTick((t) => t + 1), TICK_MS);
      return () => clearInterval(timer);
    }, [deps, userId]),
  );

  useEffect(() => {
    listHabitCategories(deps.db).then(setCategories).catch(() => undefined);
  }, [deps.db]);

  if (!userId) return null;
  const currentUserId = userId;
  const now = deps.now();

  async function run(id: string, action: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const result = await action();
      if (result.ok) setMessage(success);
      else setError(result.error);
      await reconcile(deps, currentUserId, { appOpened: false });
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAccept(input: MissionInput) {
    try {
      const result = await acceptMission(deps, currentUserId, input);
      if (!result.ok) return { error: result.error, fields: result.fields };
      setModalVisible(false);
      setMessage('¡Misión aceptada! Complétala cuando la termines.');
      await refreshChallenges(deps, currentUserId);
      return null;
    } catch {
      return { error: 'No se pudo guardar. Inténtalo de nuevo.' };
    }
  }

  const missedHabit = active.filter((c) => c.kind === 'MISSED_HABIT');
  const recovery = active.filter((c) => c.kind === 'RECOVERY');
  const usedMissions = missions.filter((m) => m.status !== 'ABANDONED').length;
  const zeroHp = hpHalfUnits === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section} accessibilityRole="header">
        Desafíos
      </Text>
      {missedHabit.length === 0 ? (
        <Text style={styles.empty}>No tienes desafíos pendientes. ¡Sigue así!</Text>
      ) : (
        missedHabit.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            timeLeftMs={timeLeftMs(challenge, now)}
            busy={busyId === challenge.id}
            onComplete={() =>
              run(challenge.id, () => completeChallenge(deps, currentUserId, challenge.id), '¡Desafío completado! Conservas tu vida.')
            }
          />
        ))
      )}

      {recovery.length > 0 ? (
        <>
          <Text style={styles.section} accessibilityRole="header">
            Recupera tus vidas
          </Text>
          {recovery.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              timeLeftMs={null}
              busy={busyId === challenge.id}
              onComplete={() =>
                run(challenge.id, () => completeChallenge(deps, currentUserId, challenge.id), '¡Recuperaste medio corazón!')
              }
            />
          ))}
        </>
      ) : null}

      <Text style={styles.section} accessibilityRole="header">
        Misiones secundarias
      </Text>
      <Text style={styles.hint}>
        Ve más allá de lo programado: {usedMissions} de {MAX_DAILY_MISSIONS} hoy.
      </Text>
      {zeroHp ? (
        <Text style={styles.error}>Sin vidas no puedes hacer misiones secundarias. Completa un desafío de recuperación.</Text>
      ) : null}
      {missions.map((mission) => (
        <View key={mission.id} style={[styles.mission, mission.status !== 'ACCEPTED' && styles.missionDone]}>
          <Text style={styles.missionTitle}>{mission.description}</Text>
          <Text style={styles.hint}>
            {formatQuantity(mission.targetQuantity, mission.unit)} · +{mission.mateLeavesReward} Hojas · +{mission.xpReward} XP
          </Text>
          {mission.status === 'ACCEPTED' ? (
            <View style={styles.row}>
              <View style={styles.flex}>
                <PixelButton
                  label="Completada"
                  disabled={zeroHp}
                  loading={busyId === mission.id}
                  onPress={() => run(mission.id, () => completeMission(deps, currentUserId, mission.id), '¡Misión completada!')}
                />
              </View>
              <View style={styles.flex}>
                <PixelButton
                  label="Abandonar"
                  variant="secondary"
                  onPress={() => run(mission.id, () => abandonMission(deps, currentUserId, mission.id), 'Misión abandonada, sin coste.')}
                />
              </View>
            </View>
          ) : (
            <Text style={mission.status === 'COMPLETED' ? styles.ok : styles.hint}>
              {mission.status === 'COMPLETED' ? '✓ Completada' : 'Abandonada'}
            </Text>
          )}
        </View>
      ))}
      <PixelButton
        label="+ Nueva misión secundaria"
        variant="secondary"
        disabled={zeroHp || usedMissions >= MAX_DAILY_MISSIONS}
        onPress={() => setModalVisible(true)}
      />

      {modalVisible ? (
        <MissionModal
        visible
        categories={categories}
        onSuggest={(categoryId: HabitCategoryId) => suggestMission(deps, currentUserId, categoryId)}
        onAccept={handleAccept}
        onClose={() => setModalVisible(false)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  section: { color: colors.navy, fontSize: 20, fontWeight: 'bold', marginTop: spacing.sm },
  empty: { color: colors.textMuted, fontSize: 15 },
  hint: { color: colors.textMuted, fontSize: 13 },
  ok: { color: colors.leaf, fontSize: 14, fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
  mission: { borderWidth: border.width, borderColor: colors.leaf, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.xs },
  missionDone: { borderColor: colors.silver, backgroundColor: colors.background },
  missionTitle: { color: colors.navy, fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
