import { create } from 'zustand';

import type { DailyMission, DailySummary, GameDate } from '@/domain/types';

/**
 * Misiones del día (RN-DAY-08): proyección de las ocurrencias de la jornada
 * actual. SQLite es la fuente de verdad; los servicios recargan este store.
 */
interface HabitsState {
  gameDate: GameDate | null;
  todayOccurrences: DailyMission[];
  /** Resumen de la jornada actual si ya se pulsó Día Finalizado (RN-CLOSE-06). */
  todaySummary: DailySummary | null;
  setToday: (gameDate: GameDate, occurrences: DailyMission[], summary: DailySummary | null) => void;
  clear: () => void;
}

export const useHabitsStore = create<HabitsState>()((set) => ({
  gameDate: null,
  todayOccurrences: [],
  todaySummary: null,
  setToday: (gameDate, todayOccurrences, todaySummary) => set({ gameDate, todayOccurrences, todaySummary }),
  clear: () => set({ gameDate: null, todayOccurrences: [], todaySummary: null }),
}));
