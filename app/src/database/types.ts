/**
 * Contrato mínimo de base de datos que usa la app.
 *
 * `SQLiteDatabase` de expo-sqlite lo cumple tal cual. En las pruebas (Node),
 * `testing/createTestDatabase.ts` lo implementa con `node:sqlite`, así los
 * repositorios y las migraciones se prueban contra SQLite real sin teléfono.
 */
export type SqlValue = string | number | null;

export interface SqlRunResult {
  changes: number;
  lastInsertRowId: number;
}

export interface SqlDatabase {
  /** Varias sentencias, SIN parámetros: solo para DDL y PRAGMA. */
  execAsync(source: string): Promise<void>;
  /** Siempre SQL parametrizado (CLAUDE.md §9.6). */
  runAsync(source: string, params: SqlValue[]): Promise<SqlRunResult>;
  getFirstAsync<T>(source: string, params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, params: SqlValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
