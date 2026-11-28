import { useState } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MISSION_DESCRIPTION_MAX_LENGTH, MISSION_REWARD } from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import { MISSION_CONGRATULATION } from '@/content/challengeTexts';
import type { MissionField, MissionInput } from '@/domain/missions';
import type { HabitCategory, HabitCategoryId } from '@/domain/types';

import { CategoryPicker } from './CategoryPicker';
import { PixelButton } from './PixelButton';
import { PixelTextInput } from './PixelTextInput';

export interface MissionDraft {
  description: string;
  targetQuantity: number;
  unit: string;
}

interface MissionModalProps {
  visible: boolean;
  categories: HabitCategory[];
  /** Pide la sugerencia de la categoría (RN-MIS-04). */
  onSuggest: (categoryId: HabitCategoryId) => Promise<MissionDraft>;
  /** Devuelve los errores por campo, o null si se aceptó. */
  onAccept: (input: MissionInput) => Promise<{ error: string; fields?: Partial<Record<MissionField, string>> } | null>;
  onClose: () => void;
}

/**
 * Modal de misión secundaria (RN-MIS-01): felicita, elige categoría y sugiere una misión editable.
 * La pantalla lo monta solo mientras está visible: así cada vez empieza con el formulario limpio.
 */
export function MissionModal({ visible, categories, onSuggest, onAccept, onClose }: MissionModalProps) {
  const [categoryId, setCategoryId] = useState<HabitCategoryId | null>(null);
  const [description, setDescription] = useState('');
  const [quantityText, setQuantityText] = useState('');
  const [unit, setUnit] = useState('');
  const [errors, setErrors] = useState<Partial<Record<MissionField, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function chooseCategory(id: HabitCategoryId) {
    setCategoryId(id);
    const suggestion = await onSuggest(id);
    setDescription(suggestion.description);
    setQuantityText(String(suggestion.targetQuantity));
    setUnit(suggestion.unit);
  }

  async function accept() {
    setSaving(true);
    const result = await onAccept({
      categoryId: categoryId ?? '',
      description,
      targetQuantity: quantityText.trim() === '' ? NaN : Number(quantityText),
      unit,
    });
    setSaving(false);
    if (result) {
      setGeneralError(result.error);
      setErrors(result.fields ?? {});
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">
              Misión secundaria
            </Text>
            <Text style={styles.text}>{MISSION_CONGRATULATION}</Text>
            <Text style={styles.reward}>
              Recompensa: +{MISSION_REWARD.leaves} Hojas de mate · +{MISSION_REWARD.xp} XP
            </Text>
            <Text style={styles.label}>Categoría</Text>
            <CategoryPicker categories={categories} selected={categoryId} onSelect={chooseCategory} />
            {errors.categoryId ? <Text style={styles.error}>{errors.categoryId}</Text> : null}
            {categoryId ? (
              <>
                <PixelTextInput
                  label="Misión (puedes cambiarla)"
                  value={description}
                  onChangeText={setDescription}
                  error={errors.description}
                  maxLength={MISSION_DESCRIPTION_MAX_LENGTH}
                />
                <View style={styles.row}>
                  <View style={styles.quantity}>
                    <PixelTextInput
                      label="Cantidad"
                      value={quantityText}
                      onChangeText={(t) => setQuantityText(t.replace(/[^0-9]/g, ''))}
                      error={errors.targetQuantity}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.flex}>
                    <PixelTextInput label="Unidad" value={unit} onChangeText={setUnit} error={errors.unit} />
                  </View>
                </View>
              </>
            ) : null}
            {generalError ? <Text style={styles.error}>{generalError}</Text> : null}
            <PixelButton label="Aceptar misión" onPress={accept} loading={saving} disabled={!categoryId} />
            <PixelButton label="Ahora no" variant="link" onPress={onClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(31, 42, 68, 0.6)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopWidth: border.width,
    borderColor: colors.gold,
  },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.navy, fontSize: 20, fontWeight: 'bold' },
  text: { color: colors.text, fontSize: 15, lineHeight: 21 },
  reward: { color: colors.leaf, fontSize: 14, fontWeight: 'bold' },
  label: { color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 13, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: spacing.sm },
  quantity: { width: 110 },
  flex: { flex: 1 },
});
