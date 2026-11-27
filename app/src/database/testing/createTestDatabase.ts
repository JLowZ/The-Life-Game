/// <reference types="node" />
/**
 * SOLO PARA PRUEBAS (Jest en Node). La app nunca importa este archivo.
 * Implementa `SqlDatabase` con el SQLite que trae Node 24 (`node:sqlite`),
 * para probar migraciones y repositorios contra un SQLite real en memoria.
 */
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { SqlDatabase, SqlValue } from '../types';

function toInputs(params: SqlValue[]): SQLInputValue[] {
  return params;
}

export function createTestDatabase(): SqlDatabase {
  const db = new DatabaseSync(':memory:');

  return {
    async execAsync(source) {
      db.exec(source);
    },
    async runAsync(source, params) {
      const result = db.prepare(source).run(...toInputs(params));
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    async getFirstAsync<T>(source: string, params: SqlValue[]) {
      const row = db.prepare(source).get(...toInputs(params));
      return (row as T | undefined) ?? null;
    },
    async getAllAsync<T>(source: string, params: SqlValue[]) {
      return db.prepare(source).all(...toInputs(params)) as T[];
    },
    async withTransactionAsync(task) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
