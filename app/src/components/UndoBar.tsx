import { StyleSheet, Text, View } from 'react-native';

import { border, colors, spacing } from '@/config/theme';

import { PixelButton } from './PixelButton';

interface UndoBarProps {
  message: string;
  secondsLeft: number;
  onUndo: () => void;
  busy?: boolean;
}

/** Aviso tras marcar, con el botón Deshacer y la cuenta atrás (RN-DAY-07, frontend.md §10). */
export function UndoBar({ message, secondsLeft, onUndo, busy = false }: UndoBarProps) {
  return (
    <View style={styles.bar} accessibilityLiveRegion="polite">
      <Text style={styles.text}>
        {message} ({secondsLeft} s)
      </Text>
      <PixelButton label="Deshacer" variant="secondary" onPress={onUndo} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy,
    borderColor: colors.gold,
    borderWidth: border.width,
    padding: spacing.sm,
  },
  text: { flex: 1, color: colors.cream, fontSize: 14, fontWeight: 'bold' },
});
