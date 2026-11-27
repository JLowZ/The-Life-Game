import * as SecureStore from 'expo-secure-store';

/**
 * Sesión de la Entrega 1 (P-57): sin backend no hay token, así que el
 * almacenamiento seguro guarda solo el id del usuario activo. Cuando llegue
 * el backend, aquí se guardará el token opaco (R-04).
 *
 * Claves permitidas por SecureStore: letras, números, '.', '-' y '_'.
 */
const ACTIVE_USER_KEY = 'activeUserId';

export function getActiveUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_USER_KEY);
}

export function setActiveUserId(userId: string): Promise<void> {
  return SecureStore.setItemAsync(ACTIVE_USER_KEY, userId);
}

/** Cerrar sesión: borra solo esta clave. Los datos del juego siguen en SQLite (RN-AUTH-08). */
export function clearActiveUserId(): Promise<void> {
  return SecureStore.deleteItemAsync(ACTIVE_USER_KEY);
}
