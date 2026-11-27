import { isHabitCategoryId } from '@/domain/categories';
import type { HabitCategoryId, UserGoal } from '@/domain/types';

import type { SqlDatabase } from '../types';

interface GoalRow {
  id: unknown;
  text: unknown;
  category_id: unknown;
  sort_order: unknown;
}

function toUserGoal(row: GoalRow): UserGoal {
  if (
    typeof row.id !== 'string' ||
    typeof row.text !== 'string' ||
    !isHabitCategoryId(row.category_id) ||
    typeof row.sort_order !== 'number'
  ) {
    throw new Error('Meta inválida en la base de datos.');
  }
  return { id: row.id, text: row.text, categoryId: row.category_id, sortOrder: row.sort_order };
}

export async function insertUserGoal(
  db: SqlDatabase,
  goal: { id: string; userId: string; text: string; categoryId: HabitCategoryId; sortOrder: number; now: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO user_goals (id, user_id, text, category_id, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [goal.id, goal.userId, goal.text, goal.categoryId, goal.sortOrder, goal.now, goal.now],
  );
}

/** Edita el texto y la categoría de una meta del usuario (Ajustes). */
export async function updateUserGoal(
  db: SqlDatabase,
  goal: { id: string; userId: string; text: string; categoryId: HabitCategoryId; now: string },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE user_goals SET text = ?, category_id = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
    [goal.text, goal.categoryId, goal.now, goal.id, goal.userId],
  );
  return result.changes === 1;
}

/** Metas activas (sin archivar) en su orden. */
export async function listUserGoals(db: SqlDatabase, userId: string): Promise<UserGoal[]> {
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT id, text, category_id, sort_order FROM user_goals
      WHERE user_id = ? AND archived_at IS NULL ORDER BY sort_order`,
    [userId],
  );
  return rows.map(toUserGoal);
}
