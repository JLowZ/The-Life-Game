import { StyleSheet, Text, View } from 'react-native';

import { border, colors, spacing } from '@/config/theme';
import { formatTimeLeft, selfDeclarationLabel } from '@/content/challengeTexts';
import type { Challenge } from '@/domain/types';

import { PixelButton } from './PixelButton';

interface ChallengeCardProps {
  challenge: Challenge;
  /** Tiempo restante ya calculado por el dominio (null = sin plazo). */
  timeLeftMs: number | null;
  busy?: boolean;
  onComplete: () => void;
}

const KIND_LABELS = {
  MISSED_HABIT: { NORMAL: 'Desafío', MINI: 'Mini desafío' },
  RECOVERY: 'Desafío de recuperación',
  SUPER: 'Superdesafío',
} as const;

function kindLabel(challenge: Challenge): string {
  if (challenge.kind === 'MISSED_HABIT') return KIND_LABELS.MISSED_HABIT[challenge.variant ?? 'NORMAL'];
  return KIND_LABELS[challenge.kind];
}

/**
 * Un desafío activo (RN-DES-02: los tipos se distinguen por etiqueta y color).
 * Autodeclaración con "Lo hice" (RN-DES-12) y cuenta atrás (RN-DES-16).
 */
export function ChallengeCard({ challenge, timeLeftMs, busy = false, onComplete }: ChallengeCardProps) {
  const isRecovery = challenge.kind === 'RECOVERY';
  const reward = `+${challenge.mateLeavesReward} Hojas · +${challenge.xpReward} XP${isRecovery ? ' · +½ corazón' : ''}`;
  return (
    <View style={[styles.card, isRecovery ? styles.recovery : styles.missed]}>
      <Text style={[styles.kind, isRecovery ? styles.kindRecovery : styles.kindMissed]}>{kindLabel(challenge)}</Text>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.reward}>{reward}</Text>
      {timeLeftMs !== null ? (
        <Text style={styles.timer} accessibilityLabel={`Quedan ${formatTimeLeft(timeLeftMs)}`}>
          ⏳ Quedan {formatTimeLeft(timeLeftMs)}
        </Text>
      ) : (
        <Text style={styles.noDeadline}>Sin plazo: hazlo cuando puedas.</Text>
      )}
      {!isRecovery ? (
        <Text style={styles.hint}>Si no lo completas a tiempo, perderás medio corazón.</Text>
      ) : null}
      <PixelButton
        label={selfDeclarationLabel(challenge.targetQuantity, challenge.unit)}
        onPress={onComplete}
        loading={busy}
        accessibilityHint="Confirma que cumpliste este desafío"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: border.width, padding: spacing.md, gap: spacing.xs, backgroundColor: colors.surface },
  missed: { borderColor: colors.gold },
  recovery: { borderColor: colors.heart },
  kind: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  kindMissed: { color: colors.gourd },
  kindRecovery: { color: colors.heart },
  title: { color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  reward: { color: colors.textMuted, fontSize: 13 },
  timer: { color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  noDeadline: { color: colors.textMuted, fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 12 },
});
