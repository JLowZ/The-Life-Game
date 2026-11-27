import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GOAL_TEXT_MAX_LENGTH } from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import type { HabitCategory, HabitCategoryId, UserGoal } from '@/domain/types';

import { CategoryPicker } from './CategoryPicker';
import { PixelButton } from './PixelButton';
import { PixelTextInput } from './PixelTextInput';

interface GoalEditorProps {
  goal: UserGoal;
  categories: HabitCategory[];
  /** Devuelve el mensaje de error, o null si se guardó. */
  onSave: (text: string, categoryId: HabitCategoryId) => Promise<string | null>;
}

/** Una meta en Ajustes: se muestra y, al pulsar "Editar", se cambia el texto y la categoría. */
export function GoalEditor({ goal, categories, onSave }: GoalEditorProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goal.text);
  const [categoryId, setCategoryId] = useState<HabitCategoryId>(goal.categoryId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const categoryName = categories.find((c) => c.id === goal.categoryId)?.name ?? goal.categoryId;

  function cancel() {
    setText(goal.text);
    setCategoryId(goal.categoryId);
    setError(null);
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    const message = await onSave(text, categoryId);
    setSaving(false);
    setError(message);
    if (!message) setEditing(false);
  }

  if (!editing) {
    return (
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.text}>{goal.text}</Text>
          <Text style={styles.category}>{categoryName}</Text>
        </View>
        <PixelButton label="Editar" variant="link" onPress={() => setEditing(true)} />
      </View>
    );
  }

  return (
    <View style={styles.editor}>
      <PixelTextInput label="Meta" value={text} onChangeText={setText} maxLength={GOAL_TEXT_MAX_LENGTH} />
      <Text style={styles.label}>Categoría</Text>
      <CategoryPicker categories={categories} selected={categoryId} onSelect={setCategoryId} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PixelButton label="Guardar meta" onPress={save} loading={saving} />
      <PixelButton label="Cancelar" variant="link" onPress={cancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: border.width,
    borderColor: colors.silver,
    paddingLeft: spacing.sm,
  },
  flex: { flex: 1, paddingVertical: spacing.xs },
  text: { color: colors.text, fontSize: 15 },
  category: { color: colors.textMuted, fontSize: 13 },
  editor: { gap: spacing.sm, borderWidth: border.width, borderColor: colors.gold, padding: spacing.sm },
  label: { color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 13 },
});
