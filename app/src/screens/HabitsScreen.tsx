import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { PixelButton } from '@/components/PixelButton';
import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';
import { formatGameDateShort, formatQuantity, WEEKDAY_SHORT } from '@/content/habitTexts';
import { weekdaysFromMask, type ScheduleInput } from '@/domain/schedule';
import type { HabitCategory } from '@/domain/types';
import { listHabits, type HabitWithSchedule } from '@/services/habitService';
import { listHabitCategories } from '@/services/onboardingService';
import { useAppDeps } from '@/services/useAppDeps';
import { useSessionStore } from '@/state/useSessionStore';

const ALL_DAYS = 7;
const MAX_DATES_SHOWN = 3;

function describeSchedule(schedule: ScheduleInput | null): string {
  if (!schedule) return 'Sin días asignados';
  if (schedule.type === 'WEEKLY') {
    const days = weekdaysFromMask(schedule.weekdays);
    return days.length === ALL_DAYS ? 'Todos los días' : days.map((d) => WEEKDAY_SHORT[d]).join(' · ');
  }
  const shown = schedule.dates.slice(0, MAX_DATES_SHOWN).map(formatGameDateShort).join(', ');
  const rest = schedule.dates.length - MAX_DATES_SHOWN;
  return rest > 0 ? `${shown} y ${rest} más` : shown;
}

/** Mis hábitos: lista de los hábitos activos con su programación (RN-HAB-01). */
export function HabitsScreen() {
  const deps = useAppDeps();
  const userId = useSessionStore((s) => s.user?.id);
  const [habits, setHabits] = useState<HabitWithSchedule[]>([]);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      listHabits(deps, userId)
        .then(setHabits)
        .catch(() => setError('No se pudieron cargar tus hábitos.'));
    }, [deps, userId]),
  );

  useEffect(() => {
    listHabitCategories(deps.db).then(setCategories).catch(() => undefined);
  }, [deps.db]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PixelButton label="+ Nuevo hábito" onPress={() => router.push('/habit-form')} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {habits.length === 0 ? (
        <Text style={styles.empty}>Aún no tienes hábitos. ¡Crea el primero!</Text>
      ) : (
        habits.map(({ habit, schedule }) => (
          <Pressable
            key={habit.id}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${habit.name}`}
            onPress={() => router.push({ pathname: '/habit-form', params: { id: habit.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Text style={styles.name}>{habit.name}</Text>
            <Text style={styles.detail}>
              {formatQuantity(habit.targetQuantity, habit.unit)} · {categoryName(habit.categoryId)}
            </Text>
            <Text style={styles.detail}>
              +{habit.mateLeavesReward} Hojas · +{habit.xpReward} XP
            </Text>
            <Text style={styles.schedule}>{describeSchedule(schedule)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    minHeight: MIN_TOUCH_SIZE,
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: { backgroundColor: colors.cream },
  name: { color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  detail: { color: colors.text, fontSize: 14 },
  schedule: { color: colors.leaf, fontSize: 13, fontWeight: 'bold' },
  empty: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
});
