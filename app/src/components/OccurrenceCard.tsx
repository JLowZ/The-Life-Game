import { StyleSheet, Text, View } from 'react-native';

import { border, colors, spacing } from '@/config/theme';
import { formatQuantity } from '@/content/habitTexts';
import type { DailyMission, HabitOccurrence } from '@/domain/types';

import { PixelButton } from './PixelButton';

interface OccurrenceCardProps {
  occurrence: DailyMission;
  categoryName: string;
  /** Si no se puede marcar, explica por qué (p. ej., 0 HP). */
  disabledReason?: string;
  busy?: boolean;
  onComplete: () => void;
  onMiss: () => void;
}

const STATUS_LABELS: Record<HabitOccurrence['status'], string> = {
  PENDING: 'Pendiente',
  COMPLETED: '✓ Cumplido',
  MISSED: '✗ No cumplido',
  CANCELLED: 'Cancelado',
  PAUSED: 'En pausa',
};

/** Una misión del día: el hábito con su copia de valores y los botones para marcarlo. */
export function OccurrenceCard({
  occurrence,
  categoryName,
  disabledReason,
  busy = false,
  onComplete,
  onMiss,
}: OccurrenceCardProps) {
  const pending = occurrence.status === 'PENDING';
  const rewards = `+${occurrence.mateLeavesReward} Hojas · +${occurrence.xpReward} XP`;
  return (
    <View style={[styles.card, !pending && styles.cardResolved]}>
      <View style={styles.header}>
        <Text style={styles.name}>{occurrence.habitName}</Text>
        {!pending ? (
          <Text
            style={[
              styles.status,
              occurrence.status === 'COMPLETED' ? styles.ok : occurrence.status === 'PAUSED' ? styles.paused : styles.missed,
            ]}
          >
            {STATUS_LABELS[occurrence.status]}
          </Text>
        ) : null}
      </View>
      <Text style={styles.detail}>
        {formatQuantity(occurrence.targetQuantity, occurrence.unit)} · {categoryName}
      </Text>
      <Text style={styles.rewards}>{rewards}</Text>
      {occurrence.habitArchived ? (
        <Text style={styles.archived}>Hábito eliminado · última vez hoy</Text>
      ) : null}
      {pending ? (
        <>
          {disabledReason ? <Text style={styles.reason}>{disabledReason}</Text> : null}
          <View style={styles.actions}>
            <View style={styles.flex}>
              <PixelButton
                label="Cumplido"
                onPress={onComplete}
                disabled={Boolean(disabledReason)}
                loading={busy}
                accessibilityHint={`Marca ${occurrence.habitName} como cumplido y suma ${rewards}`}
              />
            </View>
            <View style={styles.flex}>
              <PixelButton
                label="No cumplido"
                variant="secondary"
                onPress={onMiss}
                disabled={Boolean(disabledReason) || busy}
                accessibilityHint={`Marca ${occurrence.habitName} como no cumplido`}
              />
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardResolved: { backgroundColor: colors.background, borderColor: colors.silver },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  status: { fontSize: 14, fontWeight: 'bold' },
  ok: { color: colors.leaf },
  missed: { color: colors.error },
  paused: { color: colors.textMuted },
  detail: { color: colors.text, fontSize: 14 },
  rewards: { color: colors.textMuted, fontSize: 13 },
  reason: { color: colors.error, fontSize: 13 },
  archived: { color: colors.gourd, fontSize: 13, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  flex: { flex: 1 },
});
