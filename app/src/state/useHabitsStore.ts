import { create } from 'zustand';

import type { DailyMission, GameDate } from '@/domain/types';

/**
 * Misiones del día (RN-DAY-08): proyección de las ocurrencias de la jornada
 * actual. SQLite es la fuente de verdad; los servicios recargan este store.
 */
interface HabitsState {
  gameDate: GameDate | null;
  todayOccurrences: DailyMission[];
  setToday: (gameDate: GameDate, occurrences: DailyMission[]) => void;
  clear: () => void;
}

export const useHabitsStore = create<HabitsState>()((set) => ({
  gameDate: null,
  todayOccurrences: [],
  setToday: (gameDate, todayOccurrences) => set({ gameDate, todayOccurrences }),
  clear: () => set({ gameDate: null, todayOccurrences: [] }),
}));
