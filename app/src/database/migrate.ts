import { MIGRATION_001_INITIAL } from './migrations/001_initial';
import { MIGRATION_002_PERSONAL_DEVELOPMENT_CATEGORY } from './migrations/002_personal_development_category';
import type { SqlDatabase } from './types';

export const DATABASE_NAME = 'thelifegame.db';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/** Migraciones en orden. Nunca se edita una ya publicada: se añade otra. */
export const MIGRATIONS: readonly Migration[] = [
  { version: 1, name: '001_initial', sql: MIGRATION_001_INITIAL },
  { version: 2, name: '002_personal_development_category', sql: MIGRATION_002_PERSONAL_DEVELOPMENT_CATEGORY },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;

/**
 * Ajustes de cada conexión. `foreign_keys` no se guarda en el archivo:
 * hay que activarlo cada vez que se abre la base de datos.
 */
export async function configureConnection(db: SqlDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
}

export async function getSchemaVersion(db: SqlDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  return row?.user_version ?? 0;
}

/**
 * Lleva la base de datos a la última versión. Idempotente: si ya está al día,
 * no hace nada. Cada migración y su número de versión van en la misma
 * transacción: o se aplican las dos, o ninguna.
 */
export async function migrateDbIfNeeded(db: SqlDatabase): Promise<number> {
  await configureConnection(db);
  let current = await getSchemaVersion(db);

  if (current > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `La base de datos (v${current}) es más nueva que la app (v${LATEST_SCHEMA_VERSION}).`,
    );
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      // PRAGMA no admite parámetros; el valor es un entero nuestro, no del usuario.
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }
  return current;
}
