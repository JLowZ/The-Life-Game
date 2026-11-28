import { create } from 'zustand';

import type { Challenge, UserMission } from '@/domain/types';

/**
 * Proyección de los desafíos activos y de las misiones secundarias de hoy.
 * SQLite es la fuente de verdad; los servicios recargan este store.
 */
interface ChallengesState {
  active: Challenge[];
  todayMissions: UserMission[];
  setChallenges: (active: Challenge[], todayMissions: UserMission[]) => void;
  clear: () => void;
}

export const useChallengesStore = create<ChallengesState>()((set) => ({
  active: [],
  todayMissions: [],
  setChallenges: (active, todayMissions) => set({ active, todayMissions }),
  clear: () => set({ active: [], todayMissions: [] }),
}));
