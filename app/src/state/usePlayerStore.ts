import { create } from 'zustand';

import type { PlayerProfile } from '@/domain/types';

/**
 * Proyección de player_profiles para el HUD (RN-NAV-03). SQLite es la fuente
 * de verdad: los servicios recargan este store después de cada cambio. Los
 * valores derivados (corazones, progreso de XP) NO se guardan aquí: los
 * calcula el dominio al pintar.
 */
interface PlayerState {
  profile: PlayerProfile | null;
  setProfile: (profile: PlayerProfile | null) => void;
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
