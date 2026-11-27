import { MIN_PASSWORD_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/config/game';

/**
 * Validaciones del registro y del inicio de sesión (RN-AUTH-02, RN-AUTH-07).
 * Funciones puras: sin SQLite ni Expo. La unicidad la comprueba el servicio.
 */

export type RegistrationField = 'username' | 'email' | 'password' | 'privacy';

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
  privacyAccepted: boolean;
}

export interface NormalizedRegistration {
  username: string;
  usernameNormalized: string;
  email: string;
  password: string;
}

export type RegistrationValidation =
  | { ok: true; value: NormalizedRegistration }
  | { ok: false; errors: Partial<Record<RegistrationField, string>> };

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Unicidad sin distinguir mayúsculas (RN-AUTH-02). */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Inicio de sesión: con '@' es un correo; si no, un nombre de usuario (RN-AUTH-07). */
export function classifyLoginIdentifier(
  identifier: string,
): { kind: 'EMAIL' | 'USERNAME'; value: string } {
  const value = identifier.trim().toLowerCase();
  return { kind: value.includes('@') ? 'EMAIL' : 'USERNAME', value };
}

/** R-31: de 3 a 20 caracteres; letras, números, '_', '.' y '-'. Devuelve el error o null. */
export function validateUsername(rawUsername: string): string | null {
  const username = rawUsername.trim();
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return `El nombre de usuario debe tener entre ${USERNAME_MIN_LENGTH} y ${USERNAME_MAX_LENGTH} caracteres.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Usa solo letras, números, guion bajo, punto o guion (sin espacios ni @).';
  }
  return null;
}

export function validateRegistration(input: RegistrationInput): RegistrationValidation {
  const errors: Partial<Record<RegistrationField, string>> = {};
  const username = input.username.trim();
  const email = normalizeEmail(input.email);

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Escribe un correo válido.';
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!input.privacyAccepted) {
    errors.privacy = 'Debes aceptar el aviso de privacidad para crear la cuenta.'; // C-25
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { username, usernameNormalized: normalizeUsername(username), email, password: input.password },
  };
}
