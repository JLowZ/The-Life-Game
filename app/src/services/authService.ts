import {
  INITIAL_HP_HALF_UNITS,
  INITIAL_LEVEL,
  INITIAL_MATE_LEAVES,
  INITIAL_PERFECT_STREAK,
  INITIAL_XP,
} from '@/config/game';
import { insertPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import {
  completeUserOnboarding,
  findUserByEmail,
  findUserById,
  findUserByUsernameNormalized,
  insertUser,
  type UserRecord,
} from '@/database/repositories/usersRepository';
import { insertUserGoal } from '@/database/repositories/userGoalsRepository';
import { runInTransaction } from '@/database/transaction';
import type { SqlDatabase } from '@/database/types';
import {
  classifyLoginIdentifier,
  validateRegistration,
  type NormalizedRegistration,
  type RegistrationField,
  type RegistrationInput,
} from '@/domain/auth';
import { validateOnboarding, type OnboardingField, type OnboardingInput } from '@/domain/onboarding';

import type { AppDeps, CryptoProvider } from './deps';

/**
 * Registro, inicio y cierre de sesión LOCALES de la Entrega 1 (P-57).
 *
 * Contraseña: SHA-256(sal ‖ contraseña) con 16 bytes de sal aleatoria
 * (DATA_MODEL.md §3.1). Es una solución temporal: SHA-256 es rápido y, si
 * alguien copiara la base de datos, sería más fácil de atacar que bcrypt.
 * Con el backend (Fase 2), la contraseña pasa al servidor con bcryptjs.
 */
export const PASSWORD_ALGO = 'SHA256_SALT_V1';
export const PASSWORD_SALT_BYTES = 16;

export interface SessionUser {
  id: string;
  username: string;
  onboardingCompleted: boolean;
}

export type AccountErrors = Partial<Record<RegistrationField, string>>;

export type AccountCheckResult =
  | { ok: true; account: NormalizedRegistration }
  | { ok: false; errors: AccountErrors };

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; errors: AccountErrors & Partial<Record<OnboardingField, string>> };

export type SignInResult = { ok: true; user: SessionUser } | { ok: false; error: string };

const USERNAME_TAKEN = 'Ese nombre de usuario ya existe.';
const EMAIL_TAKEN = 'Ese correo ya está registrado.';
/** Mensaje único: no revela si el usuario existe. */
const INVALID_CREDENTIALS = 'Usuario o correo, o contraseña incorrectos.';
const MISSING_CREDENTIALS = 'Escribe tu usuario o correo y tu contraseña.';

export function hashPassword(crypto: CryptoProvider, salt: string, password: string): Promise<string> {
  return crypto.sha256Hex(`${salt}${password}`);
}

function toSessionUser(user: UserRecord): SessionUser {
  return { id: user.id, username: user.username, onboardingCompleted: user.onboardingCompletedAt !== null };
}

function uniqueViolationErrors(error: unknown): Partial<Record<RegistrationField, string>> | null {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes('UNIQUE')) return null;
  if (message.includes('users.username_normalized')) return { username: USERNAME_TAKEN };
  if (message.includes('users.email')) return { email: EMAIL_TAKEN };
  return null;
}

async function findTakenFields(db: SqlDatabase, account: NormalizedRegistration): Promise<AccountErrors> {
  const errors: AccountErrors = {};
  if (await findUserByUsernameNormalized(db, account.usernameNormalized)) errors.username = USERNAME_TAKEN;
  if (await findUserByEmail(db, account.email)) errors.email = EMAIL_TAKEN;
  return errors;
}

/**
 * Paso 1 del registro (RN-AUTH-02): valida los datos de la cuenta y comprueba
 * que el usuario y el correo estén libres. NO crea nada: la cuenta se crea al
 * final del onboarding (R-34), así el usuario puede volver atrás y corregir.
 */
export async function checkAccountAvailability(
  deps: AppDeps,
  input: RegistrationInput,
): Promise<AccountCheckResult> {
  const validation = validateRegistration(input);
  if (!validation.ok) return validation;
  const errors = await findTakenFields(deps.db, validation.value);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, account: validation.value };
}

/**
 * Último paso del registro (RN-AUTH-02, RN-AUTH-03, RN-AUTH-05, R-34).
 * En UNA transacción crea la cuenta, el perfil inicial (20 unidades de HP,
 * 0 Hojas, 0 XP, nivel 0), el propósito y las metas, y después abre la sesión.
 * Si algo falla, no queda ninguna cuenta a medias.
 */
export async function registerUser(
  deps: AppDeps,
  accountInput: RegistrationInput,
  onboardingInput: OnboardingInput,
): Promise<RegisterResult> {
  const account = validateRegistration(accountInput);
  const onboarding = validateOnboarding(onboardingInput);
  if (!account.ok || !onboarding.ok) {
    return {
      ok: false,
      errors: { ...(account.ok ? {} : account.errors), ...(onboarding.ok ? {} : onboarding.errors) },
    };
  }
  const { username, usernameNormalized, email, password } = account.value;
  const { purpose, goals } = onboarding.value;

  const now = deps.now().toISOString();
  const salt = deps.crypto.randomHex(PASSWORD_SALT_BYTES);
  const passwordHash = await hashPassword(deps.crypto, salt, password);
  const userId = deps.crypto.randomUUID();

  let result: RegisterResult;
  try {
    result = await runInTransaction(deps.db, async (): Promise<RegisterResult> => {
      // Se vuelve a comprobar: entre el paso 1 y este pudo cambiar algo.
      const errors = await findTakenFields(deps.db, account.value);
      if (Object.keys(errors).length > 0) return { ok: false, errors };

      await insertUser(deps.db, {
        id: userId,
        username,
        usernameNormalized,
        email,
        passwordHash,
        passwordSalt: salt,
        passwordAlgo: PASSWORD_ALGO,
        privacyAcceptedAt: now, // C-25
        now,
      });
      await insertPlayerProfile(deps.db, {
        userId,
        level: INITIAL_LEVEL,
        xpTotal: INITIAL_XP,
        mateLeavesBalance: INITIAL_MATE_LEAVES,
        hpHalfUnits: INITIAL_HP_HALF_UNITS,
        perfectStreak: INITIAL_PERFECT_STREAK,
        now,
      });
      for (const [index, goal] of goals.entries()) {
        await insertUserGoal(deps.db, {
          id: deps.crypto.randomUUID(),
          userId,
          text: goal.text,
          categoryId: goal.categoryId,
          sortOrder: index,
          now,
        });
      }
      await completeUserOnboarding(deps.db, { userId, purpose, now });
      return { ok: true, user: { id: userId, username, onboardingCompleted: true } };
    });
  } catch (error) {
    // Respaldo por si la UNIQUE de la tabla salta antes que la comprobación previa.
    const errors = uniqueViolationErrors(error);
    if (errors) return { ok: false, errors };
    throw error;
  }

  if (result.ok) await deps.session.setActiveUserId(result.user.id);
  return result;
}

/** RN-AUTH-07: con nombre de usuario (sin distinguir mayúsculas) o correo. */
export async function signIn(
  deps: AppDeps,
  input: { identifier: string; password: string },
): Promise<SignInResult> {
  if (input.identifier.trim().length === 0 || input.password.length === 0) {
    return { ok: false, error: MISSING_CREDENTIALS };
  }
  const { kind, value } = classifyLoginIdentifier(input.identifier);
  const user =
    kind === 'EMAIL'
      ? await findUserByEmail(deps.db, value)
      : await findUserByUsernameNormalized(deps.db, value);
  if (!user || user.passwordAlgo !== PASSWORD_ALGO) return { ok: false, error: INVALID_CREDENTIALS };

  const hash = await hashPassword(deps.crypto, user.passwordSalt, input.password);
  if (hash !== user.passwordHash) return { ok: false, error: INVALID_CREDENTIALS };

  await deps.session.setActiveUserId(user.id);
  return { ok: true, user: toSessionUser(user) };
}

/**
 * RN-AUTH-04: al abrir la app, si hay sesión y el usuario existe, se entra
 * directamente. Si la sesión apunta a un usuario que ya no existe, se limpia.
 */
export async function restoreSession(deps: AppDeps): Promise<SessionUser | null> {
  const userId = await deps.session.getActiveUserId();
  if (!userId) return null;
  const user = await findUserById(deps.db, userId);
  if (!user) {
    await deps.session.clearActiveUserId();
    return null;
  }
  return toSessionUser(user);
}

/** RN-AUTH-08 (Entrega 1): cerrar sesión no borra nada de SQLite. */
export async function signOut(deps: AppDeps): Promise<void> {
  await deps.session.clearActiveUserId();
}
