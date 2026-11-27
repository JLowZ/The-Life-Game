import type { SqlDatabase } from './types';

/**
 * Ejecuta un caso de uso en UNA transacción, sin mezclarse con otros.
 *
 * Por qué no usamos `withExclusiveTransactionAsync` de expo-sqlite: abre otra
 * conexión y ahí NO rige `PRAGMA foreign_keys`, así que perderíamos las claves
 * foráneas (docs de expo-sqlite, SDK 58).
 *
 * Por qué no basta con `withTransactionAsync`: no es exclusiva. Cualquier
 * consulta que se lance mientras está abierta se cuela dentro. Para evitarlo,
 * esta función pone las transacciones en cola: la siguiente empieza cuando
 * termina la anterior, aunque esa anterior haya fallado.
 *
 * Regla: TODA escritura del juego pasa por aquí (CLAUDE.md §9.4).
 */
const queues = new WeakMap<SqlDatabase, Promise<void>>();

export function runInTransaction<T>(db: SqlDatabase, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(db) ?? Promise.resolve();

  const run = previous.then(async () => {
    const holder: { value?: T } = {};
    await db.withTransactionAsync(async () => {
      holder.value = await task();
    });
    return holder.value as T;
  });

  // La cola sigue aunque esta transacción falle; el error llega a quien la pidió.
  queues.set(
    db,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}
