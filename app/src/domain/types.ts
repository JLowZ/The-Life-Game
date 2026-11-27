/**
 * Tipos del juego como uniones literales (frontend.md §4). Los valores
 * coinciden con los CHECK de la base de datos (docs/schema/sqlite_v1.sql).
 */

/** Fecha de jornada 'YYYY-MM-DD' (RN-DAY-02). */
export type GameDate = string;
/** Marca de tiempo ISO-8601 en UTC. */
export type IsoTimestamp = string;

/** HP interno: unidades de media vida, 0..20. No confundir con corazones mostrados. */
export type HpHalfUnits = number;

export type HabitCategoryId =
  | 'PERSONAL_DEVELOPMENT'
  | 'EXERCISE'
  | 'STUDY'
  | 'READING'
  | 'ART'
  | 'MINDFULNESS'
  | 'HEALTH'
  | 'SELF_CARE'
  | 'HOME'
  | 'FINANCE'
  | 'SOCIAL'
  | 'WORK'
  | 'SPIRITUALITY'
  | 'DIGITAL_WELLBEING'
  | 'HOBBIES'
  | 'COMMUNITY'
  | 'OTHER';

export type HabitOrigin = 'RECOMMENDED' | 'CUSTOM';
export type ScheduleType = 'WEEKLY' | 'SPECIFIC_DATE';
export type OccurrenceStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'CANCELLED' | 'PAUSED';
export type ResolutionSource = 'USER' | 'DAY_CLOSE';

export type MoodValue = 'VERY_HAPPY' | 'GOOD' | 'NEUTRAL' | 'DOWN' | 'VERY_BAD';

export type ChallengeKind = 'MISSED_HABIT' | 'RECOVERY' | 'SUPER';
export type ChallengeVariant = 'NORMAL' | 'MINI';
export type ChallengeStatus = 'PENDING' | 'COMPLETED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export type MissionStatus = 'ACCEPTED' | 'COMPLETED' | 'ABANDONED';

export type DayClassification =
  | 'PERFECT'
  | 'VERY_GOOD'
  | 'PARTIAL'
  | 'CRITICAL'
  | 'NO_ACTIVITY'
  | 'PAUSED';
export type CloseSource = 'MANUAL' | 'AUTO';

export interface HabitCategory {
  id: HabitCategoryId;
  name: string;
  sortOrder: number;
}

/** Estado de juego del usuario (tabla player_profiles). */
export interface PlayerProfile {
  userId: string;
  level: number;
  xpTotal: number;
  mateLeavesBalance: number;
  hpHalfUnits: HpHalfUnits;
  perfectStreak: number;
}

/** Meta del onboarding: texto libre + categoría (P-41, P-42). */
export interface UserGoal {
  id: string;
  text: string;
  categoryId: HabitCategoryId;
  sortOrder: number;
}

/** Unidades predefinidas (RN-HAB-08). Cualquier otro texto es una unidad libre ("otra"). */
export type HabitUnitCode = 'MINUTES' | 'PAGES' | 'REPETITIONS' | 'KILOMETERS' | 'GLASSES' | 'TIMES';

export interface Habit {
  id: string;
  userId: string;
  categoryId: HabitCategoryId;
  name: string;
  targetQuantity: number;
  /** Código de HabitUnitCode o texto libre. */
  unit: string;
  mateLeavesReward: number;
  xpReward: number;
  archivedAt: IsoTimestamp | null;
}

/** Programación de un hábito (habit_schedules). weekdays: bit 0 = lunes … bit 6 = domingo. */
export interface HabitSchedule {
  id: string;
  habitId: string;
  type: ScheduleType;
  weekdays: number | null;
  specificDate: GameDate | null;
  validFrom: GameDate;
  validTo: GameDate | null;
}

/** Ocurrencia de un hábito en una jornada, con la copia de sus valores (R-13). */
export interface HabitOccurrence {
  id: string;
  userId: string;
  habitId: string;
  gameDate: GameDate;
  status: OccurrenceStatus;
  habitName: string;
  categoryId: HabitCategoryId;
  targetQuantity: number;
  unit: string;
  mateLeavesReward: number;
  xpReward: number;
  resolvedAt: IsoTimestamp | null;
  resolutionSource: ResolutionSource | null;
  resolutionSeq: number;
}

/**
 * Misión del día: la ocurrencia de hoy y si su hábito se eliminó. Un hábito
 * eliminado conserva la misión de hoy (RN-HAB-06) y la interfaz lo avisa.
 */
export interface DailyMission extends HabitOccurrence {
  habitArchived: boolean;
}
