import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';
import type { HabitCategory, HabitCategoryId } from '@/domain/types';

interface CategoryPickerProps {
  categories: HabitCategory[];
  selected: HabitCategoryId | null;
  onSelect: (id: HabitCategoryId) => void;
}

/** Selector de categoría (P-42). La selección se marca con color Y con "✓". */
export function CategoryPicker({ categories, selected, onSelect }: CategoryPickerProps) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {categories.map((category) => {
        const isSelected = category.id === selected;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="radio"
            accessibilityLabel={category.name}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(category.id)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>
              {isSelected ? `✓ ${category.name}` : category.name}
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
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: border.width,
    borderColor: colors.navy,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.gold },
  text: { color: colors.navy, fontSize: 14 },
  textSelected: { color: colors.cream, fontWeight: 'bold' },
});
