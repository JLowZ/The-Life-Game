import { readFileSync } from 'fs';
import { join } from 'path';

import { HABIT_CATEGORY_IDS } from '@/domain/categories';

import { LATEST_SCHEMA_VERSION, getSchemaVersion, migrateDbIfNeeded } from './migrate';
import { MIGRATION_001_INITIAL } from './migrations/001_initial';
import { countCategories, listCategories } from './repositories/categoriesRepository';
import { createTestDatabase } from './testing/createTestDatabase';
import { runInTransaction } from './transaction';
import type { SqlDatabase } from './types';

const EXPECTED_TABLES = [
  'challenges',
  'currency_transactions',
  'daily_summaries',
  'habit_categories',
  'habit_occurrences',
  'habit_schedules',
  'habits',
  'hp_ledger_entries',
  'mood_entries',
  'player_profiles',
  'reward_redemptions',
  'rewards',
  'super_challenge_tasks',
  'user_goals',
  'user_missions',
  'users',
  'xp_transactions',
];

const NOW = '2026-11-26T10:00:00.000Z';

async function listTables(db: SqlDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    [],
  );
  return rows.map((r) => r.name);
}

async function insertUser(db: SqlDatabase, id: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO users (id, username, username_normalized, email, password_hash, password_salt,
       password_algo, privacy_accepted_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'hash', 'salt', 'SHA256_SALT_V1', ?, ?, ?)`,
    [id, id, id.toLowerCase(), `${id}@example.com`, NOW, NOW, NOW],
  );
}

async function countUsers(db: SqlDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM users', []);
  return row?.total ?? 0;
}

describe('migrateDbIfNeeded (Fase 3)', () => {
  it('crea las 17 tablas, siembra las 17 categorías y deja user_version = 2', async () => {
    const db = createTestDatabase();
    expect(await migrateDbIfNeeded(db)).toBe(LATEST_SCHEMA_VERSION);
    expect(LATEST_SCHEMA_VERSION).toBe(2);
    expect(await listTables(db)).toEqual(EXPECTED_TABLES);
    expect(await countCategories(db)).toBe(17);
    expect(await getSchemaVersion(db)).toBe(2);
  });

  it('es idempotente: ejecutarla dos veces no falla ni duplica datos', async () => {
    const db = createTestDatabase();
    await migrateDbIfNeeded(db);
    await migrateDbIfNeeded(db);
    expect(await countCategories(db)).toBe(17);
    expect(await getSchemaVersion(db)).toBe(2);
  });

  it('activa las claves foráneas en la conexión', async () => {
    const db = createTestDatabase();
    await migrateDbIfNeeded(db);
    await expect(
      db.runAsync(
        `INSERT INTO user_goals (id, user_id, text, category_id, created_at, updated_at)
         VALUES ('g1', 'usuario-inexistente', 'Leer más', 'READING', ?, ?)`,
        [NOW, NOW],
      ),
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  it('P-59: un teléfono que ya tenía la v1 recibe solo la 002 y conserva sus datos', async () => {
    const db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync(MIGRATION_001_INITIAL);
    await db.execAsync('PRAGMA user_version = 1');
    await insertUser(db, 'Vieja');
    expect(await migrateDbIfNeeded(db)).toBe(2);
    expect(await countCategories(db)).toBe(17);
    expect(await countUsers(db)).toBe(1);
  });

  it('rechaza una base de datos más nueva que la app', async () => {
    const db = createTestDatabase();
    await db.execAsync(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION + 1}`);
    await expect(migrateDbIfNeeded(db)).rejects.toThrow(/más nueva/);
  });

  it('la migración 001 es idéntica a docs/schema/sqlite_v1.sql', () => {
    const docs = readFileSync(join(__dirname, '../../../docs/schema/sqlite_v1.sql'), 'utf8')
      .replace(/\r\n/g, '\n');
    const docsBody = docs.slice(docs.lastIndexOf('-- ----', docs.indexOf('-- 1. Cuenta y perfil')));
    expect(MIGRATION_001_INITIAL.replace(/\r\n/g, '\n').trim()).toBe(docsBody.trim());
  });
});

describe('categoriesRepository', () => {
  it('devuelve las 17 categorías en orden y con tipos del dominio (P-59 primero)', async () => {
    const db = createTestDatabase();
    await migrateDbIfNeeded(db);
    const categories = await listCategories(db);
    expect(categories.map((c) => c.id)).toEqual(HABIT_CATEGORY_IDS);
    expect(categories[0]).toEqual({ id: 'PERSONAL_DEVELOPMENT', name: 'Desarrollo personal general', sortOrder: 0 });
    expect(categories[1]).toEqual({ id: 'EXERCISE', name: 'Ejercicio', sortOrder: 1 });
  });
});

describe('runInTransaction (CLAUDE.md §9.4: operaciones transaccionales)', () => {
  it('si la tarea falla, deshace todo lo que hizo', async () => {
    const db = createTestDatabase();
    await migrateDbIfNeeded(db);
    await expect(
      runInTransaction(db, async () => {
        await insertUser(db, 'Ana');
        throw new Error('fallo a mitad del caso de uso');
      }),
    ).rejects.toThrow('fallo a mitad');
    expect(await countUsers(db)).toBe(0);
  });

  it('tras un fallo, la siguiente transacción funciona', async () => {
    const db = createTestDatabase();
    await migrateDbIfNeeded(db);
    const failing = runInTransaction(db, async () => {
      throw new Error('primera falla');
    });
    const succeeding = runInTransaction(db, async () => {
      await insertUser(db, 'Beto');
      return 'ok';
    });
    await expect(failing).rejects.toThrow('primera falla');
    await expect(succeeding).resolves.toBe('ok');
    expect(await countUsers(db)).toBe(1);
  });

  it('pone en cola las transacciones simultáneas: no se mezclan', async () => {
    const db = createTestDatabase();
    await migrateDbIfNeeded(db);
    const order: string[] = [];
    await Promise.all([
      runInTransaction(db, async () => {
        order.push('A-inicio');
        await insertUser(db, 'Carla');
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push('A-fin');
      }),
      runInTransaction(db, async () => {
        order.push('B-inicio');
        await insertUser(db, 'Dani');
        order.push('B-fin');
      }),
    ]);
    expect(order).toEqual(['A-inicio', 'A-fin', 'B-inicio', 'B-fin']);
    expect(await countUsers(db)).toBe(2);
  });
});
