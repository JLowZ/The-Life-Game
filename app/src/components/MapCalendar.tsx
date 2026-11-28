import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, classificationColors, colors, spacing } from '@/config/theme';
import { CLASSIFICATION_LABELS, formatMonthTitle } from '@/content/dayTexts';
import { WEEKDAY_SHORT } from '@/content/habitTexts';
import { monthGrid } from '@/domain/calendar';
import type { DailySummary, GameDate } from '@/domain/types';

import { PixelButton } from './PixelButton';

interface MapCalendarProps {
  year: number;
  monthIndex: number;
  today: GameDate;
  selected: GameDate | null;
  summaries: Record<GameDate, DailySummary>;
  scheduledCounts: Record<GameDate, number>;
  onSelect: (date: GameDate) => void;
  onPrev: () => void;
  onNext: () => void;
}

const CELL_MIN_HEIGHT = 48;

/**
 * Calendario del Mapa (RN-MAP-01, RN-MAP-07): los días cerrados llevan el
 * color, el icono y la etiqueta accesible de su clasificación; hoy y los días
 * futuros muestran cuántos hábitos tienen programados.
 */
export function MapCalendar(props: MapCalendarProps) {
  const { year, monthIndex, today, selected, summaries, scheduledCounts, onSelect } = props;
  const weeks = monthGrid(year, monthIndex);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <PixelButton label="◀" variant="secondary" onPress={props.onPrev} accessibilityHint="Mes anterior" />
        <Text style={styles.title} accessibilityRole="header">
          {formatMonthTitle(year, monthIndex)}
        </Text>
        <PixelButton label="▶" variant="secondary" onPress={props.onNext} accessibilityHint="Mes siguiente" />
      </View>

      <View style={styles.row}>
        {WEEKDAY_SHORT.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day.charAt(0)}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((date, dayIndex) => {
            if (!date) return <View key={dayIndex} style={styles.cell} />;
            const summary = summaries[date];
            const scheduled = scheduledCounts[date];
            const palette = summary ? classificationColors[summary.classification] : null;
            const label = summary ? CLASSIFICATION_LABELS[summary.classification] : null;
            const dayNumber = Number(date.slice(8, 10));
            const accessibility = label
              ? `${dayNumber}: ${label.label}`
              : scheduled !== undefined
                ? `${dayNumber}: ${scheduled} ${scheduled === 1 ? 'hábito programado' : 'hábitos programados'}`
                : `${dayNumber}`;
            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={date === today ? `Hoy, ${accessibility}` : accessibility}
                accessibilityState={{ selected: date === selected }}
                onPress={() => onSelect(date)}
                style={[
                  styles.cell,
                  styles.day,
                  palette && { backgroundColor: palette.background },
                  date === today && styles.today,
                  date === selected && styles.selected,
                ]}
              >
                <Text style={[styles.dayNumber, palette && { color: palette.text }]}>{dayNumber}</Text>
                {label ? (
                  <Text style={[styles.mark, palette && { color: palette.text }]}>{label.icon}</Text>
                ) : scheduled ? (
                  <Text style={styles.scheduled}>{scheduled}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        {(Object.keys(CLASSIFICATION_LABELS) as (keyof typeof CLASSIFICATION_LABELS)[]).map((key) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: classificationColors[key].background }]}>
              <Text style={[styles.swatchIcon, { color: classificationColors[key].text }]}>{CLASSIFICATION_LABELS[key].icon}</Text>
            </View>
            <Text style={styles.legendText}>{CLASSIFICATION_LABELS[key].label}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={styles.swatch}>
            <Text style={styles.scheduled}>2</Text>
          </View>
          <Text style={styles.legendText}>Hábitos programados</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, textAlign: 'center', color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: spacing.xs },
  weekday: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 12, fontWeight: 'bold' },
  cell: { flex: 1, minHeight: CELL_MIN_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  day: { borderColor: colors.silver, borderWidth: 1, backgroundColor: colors.background },
  today: { borderColor: colors.navy, borderWidth: border.width },
  selected: { borderColor: colors.gold, borderWidth: border.width },
  dayNumber: { color: colors.text, fontSize: 13, fontWeight: 'bold' },
  mark: { fontSize: 12, fontWeight: 'bold' },
  scheduled: { color: colors.leaf, fontSize: 11, fontWeight: 'bold' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.silver,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  swatchIcon: { fontSize: 11, fontWeight: 'bold' },
  legendText: { color: colors.text, fontSize: 12 },
});
