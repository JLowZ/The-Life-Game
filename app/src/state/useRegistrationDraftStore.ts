import { create } from 'zustand';

import type { RegistrationInput } from '@/domain/auth';

/**
 * Datos de la cuenta mientras el usuario hace el onboarding (R-34).
 *
 * Vive SOLO en memoria: contiene la contraseña en claro, así que nunca se
 * guarda en SQLite ni en SecureStore. Si la app se cierra a mitad del
 * registro, se pierde y el usuario vuelve a empezar (no queda ninguna cuenta
 * a medias). Se borra al terminar el registro.
 */
interface RegistrationDraftState {
  draft: RegistrationInput | null;
  setDraft: (draft: RegistrationInput) => void;
  clearDraft: () => void;
}

export const useRegistrationDraftStore = create<RegistrationDraftState>()((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
