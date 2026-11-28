import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, colors, MIN_TOUCH_SIZE, spacing } from '@/config/theme';
import { formatGameDateShort, WEEKDAY_SHORT } from '@/content/habitTexts';
import { weekdaysFromMask, type ScheduleInput } from '@/domain/schedule';
import type { Habit } from '@/domain/types';

interface ScheduleTableProps {
  rows: { habit: Habit; schedule: ScheduleInput | null }[];
  /** Si no se puede programar (0 HP), explica por qué y bloquea la tabla. */
  disabledReason?: string;
  onEdit: (habitId: string) => void;
}

const MAX_DATES_SHOWN = 3;

/**
 * Tabla de programación del Mapa (PRODUCT_SPEC §11.2, RN-HAB-03): un hábito
 * por fila y los días de la semana en columnas. Tocar una fila abre el
 * formulario del hábito para cambiar su programación o sus valores.
 */
export function ScheduleTable({ rows, disabledReason, onEdit }: ScheduleTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.habitCell, styles.head]}>Hábito</Text>
        {WEEKDAY_SHORT.map((day) => (
          <Text key={day} style={[styles.dayCell, styles.head]}>
            {day.charAt(0)}
          </Text>
        ))}
      </View>
      {rows.map(({ habit, schedule }) => {
        const weekly = schedule?.type === 'WEEKLY' ? weekdaysFromMask(schedule.weekdays) : null;
        const dates = schedule?.type === 'SPECIFIC_DATES' ? schedule.dates : null;
        return (
          <Pressable
            key={habit.id}
            accessibilityRole="button"
            accessibilityLabel={`Editar la programación de ${habit.name}`}
            accessibilityState={{ disabled: Boolean(disabledReason) }}
            disabled={Boolean(disabledReason)}
            onPress={() => onEdit(habit.id)}
            style={({ pressed }) => [styles.row, styles.bodyRow, pressed && styles.pressed]}
          >
            <Text style={styles.habitCell} numberOfLines={2}>
              {habit.name}
            </Text>
            {dates ? (
              <Text style={styles.datesCell}>
                {dates.slice(0, MAX_DATES_SHOWN).map(formatGameDateShort).join(', ')}
                {dates.length > MAX_DATES_SHOWN ? ` y ${dates.length - MAX_DATES_SHOWN} más` : ''}
              </Text>
            ) : (
              WEEKDAY_SHORT.map((day, index) => {
                const on = weekly?.includes(index) ?? false;
                return (
                  <Text key={day} style={[styles.dayCell, on ? styles.on : styles.off]} accessibilityLabel={on ? day : undefined}>
                    {on ? '■' : '·'}
                  </Text>
                );
              })
            )}
          </Pressable>
        );
      })}
      {disabledReason ? <Text style={styles.reason}>{disabledReason}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { backgroundColor: colors.surface, borderColor: colors.navy, borderWidth: border.width },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, gap: spacing.xs },
  bodyRow: { minHeight: MIN_TOUCH_SIZE, borderTopColor: colors.silver, borderTopWidth: 1 },
  pressed: { backgroundColor: colors.cream },
  head: { color: colors.textMuted, fontWeight: 'bold', paddingVertical: spacing.xs },
  habitCell: { flex: 3, color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  dayCell: { flex: 1, textAlign: 'center', fontSize: 14 },
  datesCell: { flex: 7, color: colors.leaf, fontSize: 12, fontWeight: 'bold' },
  on: { color: colors.leaf, fontWeight: 'bold' },
  off: { color: colors.silver },
  reason: { color: colors.error, fontSize: 13, padding: spacing.sm },
});
