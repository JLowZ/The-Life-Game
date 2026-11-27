import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { PixelSprite } from './PixelSprite';

const FLAME_ROWS = ['..F..', '.FF..', '.FFF.', 'FFYFF', 'FYYYF', '.FYF.'] as const;
const PALETTE = { F: colors.gold, Y: colors.cream };

interface StreakBadgeProps {
  streak: number;
}

/** Racha de jornadas Perfecto consecutivas (RN-NAV-02, RN-CLOSE-07). */
export function StreakBadge({ streak }: StreakBadgeProps) {
  const label = streak === 1 ? 'Racha de 1 jornada perfecta' : `Racha de ${streak} jornadas perfectas`;
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <PixelSprite rows={FLAME_ROWS} palette={PALETTE} pixelSize={3} />
      <Text style={styles.text}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  text: { color: colors.cream, fontSize: 14, fontWeight: 'bold' },
});
