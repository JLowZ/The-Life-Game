import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { PixelSprite } from './PixelSprite';

const LEAF_ROWS = ['...LL', '..LLL', '.LLDL', 'LLDL.', 'LDL..', 'S....'] as const;
const PALETTE = { L: colors.leafLight, D: colors.leaf, S: colors.gourd };

interface LeavesBalanceProps {
  balance: number;
}

/** Saldo de Hojas de mate (RN-NAV-02). */
export function LeavesBalance({ balance }: LeavesBalanceProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${balance} Hojas de mate`}
    >
      <PixelSprite rows={LEAF_ROWS} palette={PALETTE} pixelSize={3} />
      <Text style={styles.text}>{balance}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  text: { color: colors.cream, fontSize: 14, fontWeight: 'bold' },
});
