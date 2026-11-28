import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DaySummaryCard } from '@/components/DaySummaryCard';
import { MapCalendar } from '@/components/MapCalendar';
import { PixelButton } from '@/components/PixelButton';
import { ScheduleTable } from '@/components/ScheduleTable';
import { border, colors, spacing } from '@/config/theme';
import { formatGameDateShort, formatQuantity } from '@/content/habitTexts';
import { monthOf, shiftMonth, yearOf } from '@/domain/calendar';
import { getGameDate } from '@/domain/gameDay';
import { isZeroHp, ZERO_HP_SCHEDULE_MESSAGE } from '@/domain/hp';
import { toggleWeekday } from '@/domain/schedule';
import type { GameDate, HabitOccurrence } from '@/domain/types';
import { listHabits, toggleHabitWeekday, type HabitWithSchedule } from '@/services/habitService';
import { loadMapDay, loadMapMonth, type MapDayDetail, type MapMonth } from '@/services/mapService';
import { loadPurpose } from '@/services/profileService';
import { useAppDeps } from '@/services/useAppDeps';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useSessionStore } from '@/state/useSessionStore';

const STATUS_ICONS: Record<HabitOccurrence['status'], string> = {
  PENDING: '○ Pendiente',
  COMPLETED: '✓ Cumplido',
  MISSED: '✗ No cumplido',
  CANCELLED: '– Cancelado',
  PAUSED: 'Ⅱ En pausa',
};

/**
 * Mapa (RN-MAP-01..09): calendario con la trayectoria y la programación,
 * detalle del día tocado y "Mis hábitos" con la tabla de programación
 * (movido desde Inicio en la Fase 9). Programar se bloquea a 0 HP (RN-NAV-04).
 */
export function MapScreen() {
  const deps = useAppDeps();
  const userId = useSessionStore((s) => s.user?.id);
  const hpHalfUnits = usePlayerStore((s) => s.profile?.hpHalfUnits);

  const [month, setMonth] = useState<{ year: number; monthIndex: number } | null>(null);
  const [data, setData] = useState<MapMonth | null>(null);
  const [selected, setSelected] = useState<GameDate | null>(null);
  const [detail, setDetail] = useState<MapDayDetail | null>(null);
  const [habits, setHabits] = useState<HabitWithSchedule[]>([]);
  const [purpose, setPurpose] = useState<string | null>(null);
  /** Toques de casilla aún guardándose: se recarga al terminar el último (evita parpadeos). */
  const pendingToggles = useRef(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (target: { year: number; monthIndex: number } | null, day: GameDate | null) => {
      if (!userId) return;
      try {
        const today = getGameDate(deps.now());
        const current = target ?? { year: yearOf(today), monthIndex: monthOf(today) };
        const [monthData, habitRows, userPurpose] = await Promise.all([
          loadMapMonth(deps, userId, current.year, current.monthIndex),
          listHabits(deps, userId),
          loadPurpose(deps.db, userId),
        ]);
        setPurpose(userPurpose);
        const focusDay = day ?? today;
        setMonth(current);
        setData(monthData);
        setHabits(habitRows);
        setSelected(focusDay);
        setDetail(await loadMapDay(deps, userId, focusDay));
        setError(null);
      } catch {
        setError('No se pudo cargar el Mapa.');
      }
    },
    [deps, userId],
  );

  useFocusEffect(
    useCallback(() => {
      load(month, selected).catch(() => undefined);
      // Solo al entrar en la pestaña: los cambios de mes y de día cargan por su cuenta.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]),
  );

  if (!userId) return null;
  const currentUserId = userId;

  async function selectDay(date: GameDate) {
    setSelected(date);
    try {
      setDetail(await loadMapDay(deps, currentUserId, date));
    } catch {
      setError('No se pudo cargar ese día.');
    }
  }

  function changeMonth(delta: number) {
    if (!month) return;
    const next = shiftMonth(month.year, month.monthIndex, delta);
    load(next, selected).catch(() => undefined);
  }

  /** Casilla de la tabla: cambio optimista y después se recarga desde SQLite. */
  async function handleToggle(habitId: string, weekdayIndex: number) {
    setHabits((rows) =>
      rows.map((row) => (row.habit.id === habitId ? { ...row, schedule: toggleWeekday(row.schedule, weekdayIndex) } : row)),
    );
    pendingToggles.current += 1;
    try {
      const result = await toggleHabitWeekday(deps, currentUserId, habitId, weekdayIndex);
      if (!result.ok) setError(result.error);
    } catch {
      setError('No se pudo guardar la programación.');
    } finally {
      pendingToggles.current -= 1;
      if (pendingToggles.current === 0) await load(month, selected);
    }
  }

  const scheduleBlocked = hpHalfUnits !== undefined && isZeroHp(hpHalfUnits) ? ZERO_HP_SCHEDULE_MESSAGE : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Mapa
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {month && data ? (
        <MapCalendar
          year={month.year}
          monthIndex={month.monthIndex}
          today={data.today}
          selected={selected}
          summaries={data.summaries}
          scheduledCounts={data.scheduledCounts}
          onSelect={selectDay}
          onPrev={() => changeMonth(-1)}
          onNext={() => changeMonth(1)}
        />
      ) : null}

      {selected && detail ? (
        <DayDetail date={selected} detail={detail} purpose={purpose} today={data?.today ?? null} />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Mis hábitos y programación
        </Text>
        <PixelButton
          label="+ Nuevo"
          onPress={() => router.push('/habit-form')}
          disabled={Boolean(scheduleBlocked)}
          accessibilityHint="Crea un hábito y asígnalo a días"
        />
      </View>
      {habits.length === 0 ? (
        <Text style={styles.empty}>Aún no tienes hábitos. Crea el primero y asígnalo a días.</Text>
      ) : (
        <ScheduleTable
          rows={habits}
          disabledReason={scheduleBlocked}
          onToggle={handleToggle}
          onEdit={(id) => router.push({ pathname: '/habit-form', params: { id } })}
        />
      )}
    </ScrollView>
  );
}

function DayDetail({
  date,
  detail,
  purpose,
  today,
}: {
  date: GameDate;
  detail: MapDayDetail;
  purpose: string | null;
  today: GameDate | null;
}) {
  const title = date === today ? `Hoy · ${formatGameDateShort(date)}` : formatGameDateShort(date);
  if (detail.kind === 'CLOSED') {
    return (
      <View style={styles.detail}>
        <DaySummaryCard summary={detail.summary} purpose={purpose} title={title} />
        <OccurrenceList occurrences={detail.occurrences} />
      </View>
    );
  }
  if (detail.kind === 'TODAY') {
    const done = detail.occurrences.filter((o) => o.status === 'COMPLETED').length;
    return (
      <View style={[styles.detail, styles.card]}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.text}>
          {detail.occurrences.length === 0
            ? 'Sin actividades programadas'
            : `Jornada en curso: ${done} de ${detail.occurrences.length} cumplidos.`}
        </Text>
        <OccurrenceList occurrences={detail.occurrences} />
      </View>
    );
  }
  if (detail.kind === 'FUTURE') {
    return (
      <View style={[styles.detail, styles.card]}>
        <Text style={styles.cardTitle}>{title}</Text>
        {detail.habits.length === 0 ? (
          <Text style={styles.text}>Sin actividades programadas</Text>
        ) : (
          detail.habits.map((habit) => (
            <Text key={habit.id} style={styles.text}>
              • {habit.name} · {formatQuantity(habit.targetQuantity, habit.unit)}
            </Text>
          ))
        )}
      </View>
    );
  }
  return (
    <View style={[styles.detail, styles.card]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.text}>Este día es anterior a tu cuenta: no hay registro.</Text>
    </View>
  );
}

function OccurrenceList({ occurrences }: { occurrences: HabitOccurrence[] }) {
  if (occurrences.length === 0) return null;
  return (
    <View style={styles.list}>
      {occurrences.map((o) => (
        <Text key={o.id} style={styles.text}>
          {STATUS_ICONS[o.status]} · {o.habitName} ({formatQuantity(o.targetQuantity, o.unit)})
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { color: colors.navy, fontSize: 20, fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
  detail: { gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.navy, borderWidth: border.width, padding: spacing.md },
  cardTitle: { color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  text: { color: colors.text, fontSize: 14, lineHeight: 20 },
  list: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sectionTitle: { flex: 1, color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  empty: { color: colors.textMuted, fontSize: 14 },
});
