import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, colors, spacing } from '@/config/theme';
import { formatGameDateShort, formatQuantity, WEEKDAY_LONG, WEEKDAY_SHORT } from '@/content/habitTexts';
import { weekdaysFromMask, type ScheduleInput } from '@/domain/schedule';
import type { Habit } from '@/domain/types';

interface ScheduleTableProps {
  rows: { habit: Habit; schedule: ScheduleInput | null }[];
  /** Si no se puede programar (0 HP), explica por qué y bloquea las casillas. */
  disabledReason?: string;
  onToggle: (habitId: string, weekdayIndex: number) => void;
  onEdit: (habitId: string) => void;
}

const MAX_DATES_SHOWN = 3;
const CELL_SIZE = 44;

/**
 * Tabla de programación del Mapa (PRODUCT_SPEC §11.2, RN-HAB-03): hábitos en
 * filas y días de la semana en columnas. Cada cruce es una casilla: un toque
 * pone o quita el chulo (✓). El nombre abre el formulario para editar el resto.
 */
export function ScheduleTable({ rows, disabledReason, onToggle, onEdit }: ScheduleTableProps) {
  const blocked = Boolean(disabledReason);
  return (
    <View style={styles.table}>
      <View style={styles.daysRow}>
        {WEEKDAY_SHORT.map((day) => (
          <Text key={day} style={styles.dayHead}>
            {day}
          </Text>
        ))}
      </View>

      {rows.map(({ habit, schedule }) => {
        const days = schedule?.type === 'WEEKLY' ? weekdaysFromMask(schedule.weekdays) : [];
        const dates = schedule?.type === 'SPECIFIC_DATES' ? schedule.dates : null;
        return (
          <View key={habit.id} style={styles.habitBlock}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ${habit.name}`}
              onPress={() => onEdit(habit.id)}
              style={({ pressed }) => [styles.nameRow, pressed && styles.pressed]}
            >
              <Text style={styles.name} numberOfLines={1}>
                {habit.name}
              </Text>
              <Text style={styles.quantity}>{formatQuantity(habit.targetQuantity, habit.unit)} ✎</Text>
            </Pressable>
            {dates ? (
              <Text style={styles.dates}>
                Fechas: {dates.slice(0, MAX_DATES_SHOWN).map(formatGameDateShort).join(', ')}
                {dates.length > MAX_DATES_SHOWN ? ` y ${dates.length - MAX_DATES_SHOWN} más` : ''}. Marca días para
                repetirlo cada semana.
              </Text>
            ) : null}
            <View style={styles.daysRow}>
              {WEEKDAY_SHORT.map((day, index) => {
                const checked = days.includes(index);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${habit.name} los ${WEEKDAY_LONG[index]}`}
                    accessibilityState={{ checked, disabled: blocked }}
                    disabled={blocked}
                    onPress={() => onToggle(habit.id, index)}
                    style={({ pressed }) => [
                      styles.cell,
                      checked && styles.cellChecked,
                      pressed && styles.cellPressed,
                      blocked && styles.cellBlocked,
                    ]}
                  >
                    {checked ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <Text style={styles.hint}>
        {disabledReason ?? 'Toca una casilla para elegir los días. Los cambios cuentan desde hoy.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  daysRow: { flexDirection: 'row', gap: spacing.xs },
  dayHead: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 12, fontWeight: 'bold' },
  habitBlock: { gap: spacing.xs, borderTopColor: colors.silver, borderTopWidth: 1, paddingTop: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 32 },
  pressed: { backgroundColor: colors.cream },
  name: { flex: 1, color: colors.navy, fontSize: 15, fontWeight: 'bold' },
  quantity: { color: colors.textMuted, fontSize: 12 },
  dates: { color: colors.gourd, fontSize: 12 },
  cell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.navy,
    borderWidth: 2,
    backgroundColor: colors.background,
  },
  cellChecked: { backgroundColor: colors.leafLight, borderColor: colors.leaf },
  cellPressed: { backgroundColor: colors.cream },
  cellBlocked: { opacity: 0.5 },
  check: { color: colors.navy, fontSize: 20, fontWeight: 'bold' },
  hint: { color: colors.textMuted, fontSize: 12 },
});
