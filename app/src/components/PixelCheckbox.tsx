import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';

interface PixelCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  error?: string;
}

const BOX_SIZE = 24;

export function PixelCheckbox({ label, checked, onToggle, error }: PixelCheckboxProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={styles.row}
      >
        <View style={[styles.box, error ? styles.boxError : null]}>
          {checked ? <View style={styles.check} /> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: { minHeight: MIN_TOUCH_SIZE, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: border.width,
    borderColor: colors.navy,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxError: { borderColor: colors.error },
  check: { width: BOX_SIZE / 2, height: BOX_SIZE / 2, backgroundColor: colors.leaf },
  label: { flex: 1, color: colors.text, fontSize: 15 },
  error: { color: colors.error, fontSize: 13 },
});
