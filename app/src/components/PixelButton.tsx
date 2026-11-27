import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';

interface PixelButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}

/** Botón de bordes rectos al estilo pixel art. Zona táctil ≥ 48 dp. */
export function PixelButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
}: PixelButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole={variant === 'link' ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant !== 'link' && styles.pressed,
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.cream : colors.navy} />
      ) : (
        <Text style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelDark]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: border.radius,
  },
  primary: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
    borderWidth: border.width,
  },
  secondary: {
    backgroundColor: colors.cream,
    borderColor: colors.navy,
    borderWidth: border.width,
  },
  link: {
    backgroundColor: 'transparent',
  },
  pressed: { transform: [{ translateY: 2 }] },
  inactive: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: 'bold' },
  labelPrimary: { color: colors.cream },
  labelDark: { color: colors.navy },
});
