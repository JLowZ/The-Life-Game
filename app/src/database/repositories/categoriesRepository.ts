import { isHabitCategoryId } from '@/domain/categories';
import type { HabitCategory } from '@/domain/types';

import type { SqlDatabase } from '../types';

interface CategoryRow {
  id: unknown;
  name: unknown;
  sort_order: unknown;
}

/** Valida una fila en el borde (frontend.md §4): de `unknown` a tipo del dominio. */
function toHabitCategory(row: CategoryRow): HabitCategory {
  if (!isHabitCategoryId(row.id) || typeof row.name !== 'string' || typeof row.sort_order !== 'number') {
    throw new Error(`Categoría inválida en la base de datos: ${String(row.id)}`);
  }
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}

export async function listCategories(db: SqlDatabase): Promise<HabitCategory[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT id, name, sort_order FROM habit_categories ORDER BY sort_order',
    [],
  );
  return rows.map(toHabitCategory);
}

export async function countCategories(db: SqlDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM habit_categories',
    [],
  );
  return row?.total ?? 0;
}
