import { create } from 'zustand';

import type { SessionUser } from '@/services/authService';

/**
 * Sesión en memoria (proyección de SecureStore + tabla users).
 * - LOADING: aún no se ha leído la sesión guardada.
 * - SIGNED_OUT: bienvenida, registro o inicio de sesión.
 * - NEEDS_ONBOARDING: registrado, falta propósito y metas.
 * - SIGNED_IN: entra a las pestañas.
 */
export type SessionStatus = 'LOADING' | 'SIGNED_OUT' | 'NEEDS_ONBOARDING' | 'SIGNED_IN';

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'LOADING',
  user: null,
  setUser: (user) =>
    set({
      user,
      status: user === null ? 'SIGNED_OUT' : user.onboardingCompleted ? 'SIGNED_IN' : 'NEEDS_ONBOARDING',
    }),
}));
