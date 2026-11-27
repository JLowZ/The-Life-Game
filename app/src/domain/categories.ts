import type { HabitCategoryId } from './types';

/**
 * Las 17 categorías (P-42 + P-59), en el orden en que se muestran.
 * 'PERSONAL_DEVELOPMENT' (Desarrollo personal general) abarca todas las demás.
 */
export const HABIT_CATEGORY_IDS: readonly HabitCategoryId[] = [
  'PERSONAL_DEVELOPMENT',
  'EXERCISE',
  'STUDY',
  'READING',
  'ART',
  'MINDFULNESS',
  'HEALTH',
  'SELF_CARE',
  'HOME',
  'FINANCE',
  'SOCIAL',
  'WORK',
  'SPIRITUALITY',
  'DIGITAL_WELLBEING',
  'HOBBIES',
  'COMMUNITY',
  'OTHER',
];

export function isHabitCategoryId(value: unknown): value is HabitCategoryId {
  return typeof value === 'string' && (HABIT_CATEGORY_IDS as readonly string[]).includes(value);
}
