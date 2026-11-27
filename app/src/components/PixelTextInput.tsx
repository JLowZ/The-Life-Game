import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';

interface PixelTextInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
}

/** Campo de texto con etiqueta y error junto al campo (frontend.md §10). */
export function PixelTextInput({ label, error, ...inputProps }: PixelTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  input: {
    minHeight: MIN_TOUCH_SIZE,
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    borderRadius: border.radius,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 13 },
});
