/**
 * Constantes de juego (R-21). Ninguna regla usa números sueltos: todo sale de aquí.
 * Fuente: .claude/rules/business-logic.md §1 y docs/BUSINESS_RULES.md.
 * Cambiar un valor de esta lista es cambiar una regla: sigue CLAUDE.md §13.
 */

/** HP en unidades de media vida: 20 unidades = 10 corazones (RN-HP-01, R-01). */
export const MAX_HP_HALF_UNITS = 20;
export const MIN_HP_HALF_UNITS = 0;
/** Perfil inicial (C-05, RN-AUTH-03). */
export const INITIAL_HP_HALF_UNITS = MAX_HP_HALF_UNITS;
export const INITIAL_MATE_LEAVES = 0;
export const INITIAL_XP = 0;
export const INITIAL_LEVEL = 0;
export const INITIAL_PERFECT_STREAK = 0;
/** 1 corazón = 2 unidades de media vida (R-01). */
export const HALF_UNITS_PER_HEART = 2;

/** La jornada termina a las 04:00 hora del teléfono (RN-DAY-01). */
export const DAY_CUTOFF_HOUR = 4;

/** Plazo de un desafío por incumplimiento y gracia única (P-09, INT-18). */
export const CHALLENGE_DURATION_HOURS = 72;
export const GRACE_HOURS = 12;

/**
 * Ocurrencias (R-26): horizonte móvil de 0 días. Solo se guarda la fila de la
 * jornada actual; las futuras se calculan desde la programación. Así, editar
 * un hábito "regenera" las futuras sin tocar filas (RN-HAB-05).
 */
export const OCCURRENCE_HORIZON_DAYS = 0;

/**
 * Formulario de hábitos (R-35, propuesta de la Fase 6): límites técnicos.
 * El selector de fechas concretas ofrece las próximas 4 semanas.
 */
export const HABIT_NAME_MAX_LENGTH = 60;
export const HABIT_MAX_QUANTITY = 9999;
export const CUSTOM_UNIT_MAX_LENGTH = 20;
export const SPECIFIC_DATE_WINDOW_DAYS = 28;

/** Ventana para deshacer un marcado (RN-DAY-07). */
export const UNDO_WINDOW_SECONDS = 10;

/** Recompensas permitidas por hábito (C-06, P-54, INT-04). */
export const ALLOWED_LEAVES = [0, 5, 10, 15, 20, 25, 30] as const;
export const ALLOWED_XP = [0, 10, 20, 30, 40, 50] as const;
/** Dificultad mostrada según la XP (RN-HAB-02): Fácil 10 · Media 20–30 · Difícil 40–50. */
export const XP_DIFFICULTY_THRESHOLDS = { easy: 10, medium: 20, hard: 40 } as const;

/** Recompensa de un desafío completado: ½ Hojas (hacia abajo) + 20 % XP (C-27). */
export const CHALLENGE_LEAVES_DIVISOR = 2;
export const CHALLENGE_XP_PERCENT = 20;

/** Tamaño de los desafíos respecto a la cantidad del hábito (P-07). */
export const NORMAL_CHALLENGE_PERCENT = 50;
export const MINI_CHALLENGE_PERCENT = 10;

/** Misiones secundarias (C-31, P-58). */
export const MISSION_REWARD = { leaves: 20, xp: 20 } as const;
export const MAX_DAILY_MISSIONS = 3;

/** Recompensas reales (C-30). */
export const MIN_REAL_REWARD_COST = 20;

/** Curva de niveles: XP total para el nivel n = A·n² + B·n (P-03). */
export const LEVEL_CURVE = { a: 40, b: 60 } as const;

/** Umbrales de clasificación del día en % (C-14). PERFECT exige el 100 %. */
export const CLASSIFICATION_THRESHOLDS = { veryGood: 85, partial: 40 } as const;

/** Registro: contraseña de mínimo 6 caracteres (RN-AUTH-02). */
export const MIN_PASSWORD_LENGTH = 6;
/**
 * Nombre de usuario: 3 a 20 caracteres (letras, números, '_', '.', '-').
 * PROPUESTA técnica de la Fase 4, pendiente de aprobación: sin '@' ni espacios
 * para que "usuario o correo" (RN-AUTH-07) no sea ambiguo.
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/**
 * Onboarding (RN-AUTH-02): propósito obligatorio y al menos una meta.
 * Los máximos son límites técnicos de los campos de texto (propuesta de la Fase 4).
 */
export const PURPOSE_MAX_LENGTH = 200;
export const GOAL_TEXT_MAX_LENGTH = 100;
export const MIN_ONBOARDING_GOALS = 1;
