import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryPicker } from '@/components/CategoryPicker';
import { ChoiceChips } from '@/components/ChoiceChips';
import { PixelButton } from '@/components/PixelButton';
import { PixelTextInput } from '@/components/PixelTextInput';
import {
  ALLOWED_LEAVES,
  ALLOWED_XP,
  CUSTOM_UNIT_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  SPECIFIC_DATE_WINDOW_DAYS,
} from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import { DIFFICULTY_LABELS, formatGameDateShort, UNIT_LABELS, WEEKDAY_SHORT } from '@/content/habitTexts';
import { getGameDate } from '@/domain/gameDay';
import { difficultyForXp, HABIT_UNIT_CODES, isHabitUnitCode } from '@/domain/habits';
import { addDays, maskFromWeekdays, weekdaysFromMask, type ScheduleInput } from '@/domain/schedule';
import type { GameDate, HabitCategory, HabitCategoryId } from '@/domain/types';
import {
  createHabit,
  deleteHabit,
  getHabit,
  updateHabit,
  type HabitFormErrors,
} from '@/services/habitService';
import { refreshToday } from '@/services/occurrenceService';
import { listHabitCategories } from '@/services/onboardingService';
import { useAppDeps } from '@/services/useAppDeps';
import { useSessionStore } from '@/state/useSessionStore';

const OTHER_UNIT = 'OTHER';
const DEFAULT_LEAVES = 10;
const DEFAULT_XP = 20;
type ScheduleMode = 'WEEKLY' | 'SPECIFIC_DATES';

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Crear o editar un hábito con su programación (RN-HAB-01..09). Con `id` en la ruta, edita. */
export function HabitFormScreen() {
  const deps = useAppDeps();
  const userId = useSessionStore((s) => s.user?.id);
  const { id: habitId } = useLocalSearchParams<{ id?: string }>();
  const isEdit = typeof habitId === 'string' && habitId.length > 0;
  const today = useMemo(() => getGameDate(deps.now()), [deps]);

  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<HabitCategoryId | null>(null);
  const [quantityText, setQuantityText] = useState('');
  const [unitChoice, setUnitChoice] = useState<string>('MINUTES');
  const [customUnit, setCustomUnit] = useState('');
  const [leaves, setLeaves] = useState<number>(DEFAULT_LEAVES);
  const [xp, setXp] = useState<number>(DEFAULT_XP);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('WEEKLY');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [dates, setDates] = useState<GameDate[]>([]);

  const [errors, setErrors] = useState<HabitFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    listHabitCategories(deps.db).then(setCategories).catch(() => undefined);
  }, [deps.db]);

  // En edición, rellena el formulario con el hábito guardado.
  useEffect(() => {
    if (!isEdit || !userId) return;
    getHabit(deps, userId, habitId)
      .then((found) => {
        if (!found) {
          setGeneralError('Este hábito ya no existe.');
          return;
        }
        const { habit, schedule } = found;
        setName(habit.name);
        setCategoryId(habit.categoryId);
        setQuantityText(String(habit.targetQuantity));
        if (isHabitUnitCode(habit.unit)) setUnitChoice(habit.unit);
        else {
          setUnitChoice(OTHER_UNIT);
          setCustomUnit(habit.unit);
        }
        setLeaves(habit.mateLeavesReward);
        setXp(habit.xpReward);
        if (schedule?.type === 'WEEKLY') {
          setScheduleMode('WEEKLY');
          setWeekdays(weekdaysFromMask(schedule.weekdays));
        } else if (schedule?.type === 'SPECIFIC_DATES') {
          setScheduleMode('SPECIFIC_DATES');
          setDates(schedule.dates);
        }
      })
      .catch(() => setGeneralError('No se pudo cargar el hábito.'));
  }, [deps, habitId, isEdit, userId]);

  if (!userId) return null;
  const currentUserId = userId;

  const dateOptions = Array.from({ length: SPECIFIC_DATE_WINDOW_DAYS }, (_, i) => {
    const date = addDays(today, i);
    return { value: date, label: i === 0 ? `Hoy (${formatGameDateShort(date)})` : formatGameDateShort(date) };
  });

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function save() {
    setSaving(true);
    setGeneralError(null);
    const habitInput = {
      name,
      categoryId: categoryId ?? '',
      targetQuantity: quantityText.trim() === '' ? NaN : Number(quantityText),
      unit: unitChoice === OTHER_UNIT ? customUnit : unitChoice,
      mateLeavesReward: leaves,
      xpReward: xp,
    };
    const scheduleInput: ScheduleInput =
      scheduleMode === 'WEEKLY'
        ? { type: 'WEEKLY', weekdays: maskFromWeekdays(weekdays) }
        : { type: 'SPECIFIC_DATES', dates };
    try {
      const result = isEdit
        ? await updateHabit(deps, currentUserId, habitId, habitInput, scheduleInput)
        : await createHabit(deps, currentUserId, habitInput, scheduleInput);
      if (!result.ok) {
        setErrors(result.errors);
        setGeneralError('Revisa los campos marcados.');
        return;
      }
      await refreshToday(deps, currentUserId);
      router.back();
    } catch {
      setGeneralError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteHabit(deps, currentUserId, habitId);
      await refreshToday(deps, currentUserId);
      router.back();
    } catch {
      setGeneralError('No se pudo eliminar. Inténtalo de nuevo.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PixelTextInput
          label="Nombre del hábito"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Ej.: Leer"
          maxLength={HABIT_NAME_MAX_LENGTH}
        />

        <Field label="Categoría" error={errors.categoryId}>
          <CategoryPicker categories={categories} selected={categoryId} onSelect={setCategoryId} />
        </Field>

        <PixelTextInput
          label="Cantidad (lo que vas a medir)"
          value={quantityText}
          onChangeText={(text) => setQuantityText(text.replace(/[^0-9]/g, ''))}
          error={errors.targetQuantity}
          keyboardType="number-pad"
          placeholder="Ej.: 20"
        />

        <Field label="Unidad" error={errors.unit}>
          <ChoiceChips
            accessibilityLabel="Unidad"
            options={[
              ...HABIT_UNIT_CODES.map((code) => ({ value: code as string, label: UNIT_LABELS[code].plural })),
              { value: OTHER_UNIT, label: 'Otra' },
            ]}
            selected={[unitChoice]}
            onToggle={setUnitChoice}
          />
          {unitChoice === OTHER_UNIT ? (
            <PixelTextInput
              label="Escribe la unidad"
              value={customUnit}
              onChangeText={setCustomUnit}
              placeholder="Ej.: abdominales"
              maxLength={CUSTOM_UNIT_MAX_LENGTH}
            />
          ) : null}
        </Field>

        <Field label="Hojas de mate al cumplirlo" error={errors.mateLeavesReward}>
          <ChoiceChips
            accessibilityLabel="Hojas de mate"
            options={ALLOWED_LEAVES.map((value) => ({ value: value as number, label: String(value) }))}
            selected={[leaves]}
            onToggle={setLeaves}
          />
        </Field>

        <Field label="Dificultad (XP al cumplirlo)" error={errors.xpReward}>
          <ChoiceChips
            accessibilityLabel="Dificultad"
            options={ALLOWED_XP.map((value) => ({
              value: value as number,
              label: `${value} · ${DIFFICULTY_LABELS[difficultyForXp(value)]}`,
            }))}
            selected={[xp]}
            onToggle={setXp}
          />
        </Field>

        <Field label="¿Qué días?" error={errors.schedule}>
          <ChoiceChips
            accessibilityLabel="Tipo de programación"
            options={[
              { value: 'WEEKLY' as ScheduleMode, label: 'Días de la semana' },
              { value: 'SPECIFIC_DATES' as ScheduleMode, label: 'Fechas concretas' },
            ]}
            selected={[scheduleMode]}
            onToggle={setScheduleMode}
          />
          {scheduleMode === 'WEEKLY' ? (
            <ChoiceChips
              multiple
              accessibilityLabel="Días de la semana"
              options={WEEKDAY_SHORT.map((label, index) => ({ value: index, label }))}
              selected={weekdays}
              onToggle={(day) => setWeekdays((current) => toggle(current, day))}
            />
          ) : (
            <ChoiceChips
              multiple
              accessibilityLabel="Fechas concretas"
              options={dateOptions}
              selected={dates}
              onToggle={(date) => setDates((current) => toggle(current, date))}
            />
          )}
          {isEdit ? (
            <Text style={styles.hint}>
              Los cambios valen desde hoy. Si hoy ya tenías este hábito, conserva sus valores; tu historial no
              cambia.
            </Text>
          ) : null}
        </Field>

        {generalError ? <Text style={styles.error}>{generalError}</Text> : null}
        <PixelButton label={isEdit ? 'Guardar cambios' : 'Crear hábito'} onPress={save} loading={saving} />
        {isEdit ? (
          <PixelButton
            label={confirmDelete ? 'Pulsa otra vez para eliminar' : 'Eliminar hábito'}
            variant="secondary"
            onPress={remove}
            accessibilityHint="Deja de programarse desde mañana. Tu historial se conserva."
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  field: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.silver,
    borderWidth: border.width,
    padding: spacing.sm,
  },
  label: { color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  error: { color: colors.error, fontSize: 13, fontWeight: 'bold' },
});
