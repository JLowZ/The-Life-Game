import { StyleSheet, Text, View } from 'react-native';

import { border, classificationColors, colors, spacing } from '@/config/theme';
import { CLASSIFICATION_LABELS, formatPercent, MOOD_LABELS, renderCloseMessage } from '@/content/dayTexts';
import { completionPercent } from '@/domain/dayClose';
import type { DailySummary } from '@/domain/types';

interface DaySummaryCardProps {
  summary: DailySummary;
  purpose: string | null;
  title?: string;
}

/**
 * Resumen de una jornada cerrada (RN-MAP-05, RN-MAP-06, RN-MAP-08,
 * RN-CLOSE-06): clasificación con color, icono y texto; porcentaje; último
 * ánimo y mensaje según el rendimiento.
 */
export function DaySummaryCard({ summary, purpose, title }: DaySummaryCardProps) {
  const palette = classificationColors[summary.classification];
  const label = CLASSIFICATION_LABELS[summary.classification];
  const message = renderCloseMessage(summary.messageId, purpose);
  const paused = summary.classification === 'PAUSED';
  const percent = completionPercent(summary.completedCount, summary.scheduledCount);

  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={[styles.badge, { backgroundColor: palette.background }]}>
        <Text style={[styles.badgeText, { color: palette.text }]}>
          {label.icon} {label.label}
        </Text>
      </View>
      {summary.classification !== 'NO_ACTIVITY' && !paused ? (
        <Text style={styles.detail}>
          {summary.completedCount} de {summary.scheduledCount} cumplidos · {formatPercent(percent)}
        </Text>
      ) : null}
      {paused ? <Text style={styles.detail}>No cuenta en el porcentaje ni en la racha.</Text> : null}
      <Text style={styles.detail}>Racha: {summary.streakAfter}</Text>
      {summary.lastMood ? <Text style={styles.detail}>Ánimo: {MOOD_LABELS[summary.lastMood]}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderColor: colors.gold,
    borderWidth: border.width,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: { color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { fontSize: 14, fontWeight: 'bold' },
  detail: { color: colors.text, fontSize: 14 },
  message: { color: colors.navy, fontSize: 15, lineHeight: 22, fontStyle: 'italic', marginTop: spacing.xs },
});
