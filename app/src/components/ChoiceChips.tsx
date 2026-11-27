import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
}

interface ChoiceChipsProps<T extends string | number> {
  options: readonly ChoiceOption<T>[];
  /** Valores seleccionados (uno en selección simple). */
  selected: readonly T[];
  onToggle: (value: T) => void;
  multiple?: boolean;
  accessibilityLabel: string;
}

/**
 * Fichas seleccionables pixel art (Hojas, XP, unidad, días…). La selección se
 * marca con color Y con "✓" (frontend.md §9).
 */
export function ChoiceChips<T extends string | number>({
  options,
  selected,
  onToggle,
  multiple = false,
  accessibilityLabel,
}: ChoiceChipsProps<T>) {
  return (
    <View
      style={styles.grid}
      accessibilityRole={multiple ? undefined : 'radiogroup'}
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityLabel={option.label}
            accessibilityState={multiple ? { checked: isSelected } : { selected: isSelected }}
            onPress={() => onToggle(option.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>
              {isSelected ? `✓ ${option.label}` : option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: border.width,
    borderColor: colors.navy,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.gold },
  text: { color: colors.navy, fontSize: 14 },
  textSelected: { color: colors.cream, fontWeight: 'bold' },
});
