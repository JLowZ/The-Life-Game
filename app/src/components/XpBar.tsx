import { StyleSheet, Text, View } from 'react-native';

import { border, colors, spacing } from '@/config/theme';
import type { LevelProgress } from '@/domain/level';

interface XpBarProps {
  progress: LevelProgress;
}

const BAR_HEIGHT = 12;

/** Barra de XP del nivel actual (RN-NAV-02). Recibe el progreso ya calculado. */
export function XpBar({ progress }: XpBarProps) {
  const ratio = progress.xpForNextLevel > 0 ? progress.xpIntoLevel / progress.xpForNextLevel : 0;
  const label = `${progress.xpIntoLevel} / ${progress.xpForNextLevel} XP`;
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Nivel ${progress.level}. ${label}. Faltan ${progress.xpToNextLevel} XP para subir.`}
      accessibilityValue={{ min: 0, max: progress.xpForNextLevel, now: progress.xpIntoLevel }}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: {
    flex: 1,
    height: BAR_HEIGHT,
    borderWidth: 2,
    borderColor: colors.cream,
    backgroundColor: colors.navyLight,
    borderRadius: border.radius,
  },
  fill: { height: '100%', backgroundColor: colors.gold },
  text: { color: colors.cream, fontSize: 12, fontWeight: 'bold' },
});
