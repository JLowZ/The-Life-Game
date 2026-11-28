import type { SqlDatabase } from '../types';

/**
 * Cuentas locales de la Entrega 1 (P-57, DATA_MODEL.md §3.1).
 * SQL siempre parametrizado (CLAUDE.md §9.6).
 */

export interface UserRecord {
  id: string;
  username: string;
  usernameNormalized: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  passwordAlgo: string;
  purpose: string | null;
  onboardingCompletedAt: string | null;
}

export interface NewUser {
  id: string;
  username: string;
  usernameNormalized: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  passwordAlgo: string;
  privacyAcceptedAt: string;
  now: string;
}

interface UserRow {
  id: unknown;
  username: unknown;
  username_normalized: unknown;
  email: unknown;
  password_hash: unknown;
  password_salt: unknown;
  password_algo: unknown;
  purpose: unknown;
  onboarding_completed_at: unknown;
}

const COLUMNS = `id, username, username_normalized, email, password_hash, password_salt,
  password_algo, purpose, onboarding_completed_at`;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

/** Valida la fila en el borde (frontend.md §4). */
function toUserRecord(row: UserRow): UserRecord {
  if (
    !isString(row.id) ||
    !isString(row.username) ||
    !isString(row.username_normalized) ||
    !isString(row.email) ||
    !isString(row.password_hash) ||
    !isString(row.password_salt) ||
    !isString(row.password_algo) ||
    !isNullableString(row.purpose) ||
    !isNullableString(row.onboarding_completed_at)
  ) {
    throw new Error('Usuario inválido en la base de datos.');
  }
  return {
    id: row.id,
    username: row.username,
    usernameNormalized: row.username_normalized,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    passwordAlgo: row.password_algo,
    purpose: row.purpose,
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

async function findOne(db: SqlDatabase, where: string, value: string): Promise<UserRecord | null> {
  const row = await db.getFirstAsync<UserRow>(`SELECT ${COLUMNS} FROM users WHERE ${where} = ?`, [value]);
  return row ? toUserRecord(row) : null;
}

export function findUserById(db: SqlDatabase, id: string): Promise<UserRecord | null> {
  return findOne(db, 'id', id);
}

export function findUserByUsernameNormalized(
  db: SqlDatabase,
  usernameNormalized: string,
): Promise<UserRecord | null> {
  return findOne(db, 'username_normalized', usernameNormalized);
}

export function findUserByEmail(db: SqlDatabase, email: string): Promise<UserRecord | null> {
  return findOne(db, 'email', email);
}

export async function insertUser(db: SqlDatabase, user: NewUser): Promise<void> {
  await db.runAsync(
    `INSERT INTO users (id, username, username_normalized, email, password_hash, password_salt,
       password_algo, privacy_accepted_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.username,
      user.usernameNormalized,
      user.email,
      user.passwordHash,
      user.passwordSalt,
      user.passwordAlgo,
      user.privacyAcceptedAt,
      user.now,
      user.now,
    ],
  );
}

/** Cambia el nombre de usuario (Ajustes). La UNIQUE de la tabla impide duplicados. */
export async function updateUsername(
  db: SqlDatabase,
  params: { userId: string; username: string; usernameNormalized: string; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE users SET username = ?, username_normalized = ?, updated_at = ?, version = version + 1
      WHERE id = ?`,
    [params.username, params.usernameNormalized, params.now, params.userId],
  );
  return result.changes === 1;
}

/**
 * Guarda el propósito y marca el onboarding como terminado. Solo actúa si
 * aún no estaba terminado: devuelve `false` si ya lo estaba (idempotencia).
 */
export async function completeUserOnboarding(
  db: SqlDatabase,
  params: { userId: string; purpose: string; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE users
        SET purpose = ?, onboarding_completed_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND onboarding_completed_at IS NULL`,
    [params.purpose, params.now, params.now, params.userId],
  );
  return result.changes === 1;
}

/** Fecha de alta: la primera jornada que la reconciliación puede cerrar. */
export async function findUserCreatedAt(db: SqlDatabase, userId: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ created_at: string }>('SELECT created_at FROM users WHERE id = ?', [userId]);
  return row?.created_at ?? null;
}

/** Propósito del onboarding: personaliza el mensaje de cierre ("la meta", P-34). */
export async function findUserPurpose(db: SqlDatabase, userId: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ purpose: string | null }>('SELECT purpose FROM users WHERE id = ?', [userId]);
  return row?.purpose ?? null;
}
