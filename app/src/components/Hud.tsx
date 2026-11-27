import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';
import type { HeartState } from '@/domain/hp';
import type { LevelProgress } from '@/domain/level';

import { HeartsBar } from './HeartsBar';
import { LeavesBalance } from './LeavesBalance';
import { PixelAvatar } from './PixelAvatar';
import { PixelSprite } from './PixelSprite';
import { StreakBadge } from './StreakBadge';
import { XpBar } from './XpBar';

const GEAR_ROWS = ['..G.G..', '.GGGGG.', 'GGG.GGG', '.G...G.', 'GGG.GGG', '.GGGGG.', '..G.G..'] as const;
const GEAR_PALETTE = { G: colors.cream };

export interface HudProps {
  username: string;
  hearts: HeartState[];
  hpLabel: string;
  levelProgress: LevelProgress;
  streak: number;
  mateLeaves: number;
  /** Si se pasa, muestra el engranaje de Ajustes. */
  onOpenSettings?: () => void;
}

/**
 * HUD (RN-NAV-02): avatar, nombre, nivel, barra de XP, diez corazones, racha y
 * Hojas. Presentacional: recibe todo ya calculado por el dominio.
 */
export function Hud({ username, hearts, hpLabel, levelProgress, streak, mateLeaves, onOpenSettings }: HudProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.avatarFrame}>
          <PixelAvatar pixelSize={3} />
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.level}>Nivel {levelProgress.level}</Text>
        </View>
        <View style={styles.counters}>
          <StreakBadge streak={streak} />
          <LeavesBalance balance={mateLeaves} />
        </View>
        {onOpenSettings ? (
          <Pressable
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
            hitSlop={spacing.xs}
            style={styles.gear}
          >
            <PixelSprite rows={GEAR_ROWS} palette={GEAR_PALETTE} pixelSize={3} />
          </Pressable>
        ) : null}
      </View>
      <HeartsBar hearts={hearts} label={hpLabel} />
      <XpBar progress={levelProgress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    borderBottomColor: colors.gold,
    borderBottomWidth: border.width,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarFrame: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.steam,
    padding: 2,
  },
  identity: { flex: 1 },
  name: { color: colors.cream, fontSize: 16, fontWeight: 'bold' },
  level: { color: colors.gold, fontSize: 13, fontWeight: 'bold' },
  counters: { gap: spacing.xs, alignItems: 'flex-start' },
  gear: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
