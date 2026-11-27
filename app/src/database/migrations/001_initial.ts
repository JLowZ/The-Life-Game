/**
 * Migración 001: esquema inicial de la Entrega 1 (DATA_MODEL.md v1.3, P-57).
 * Copia exacta de docs/schema/sqlite_v1.sql a partir de la sección 1
 * (sin la cabecera ni el PRAGMA, que aplica migrate.ts).
 * Una prueba (migrate.test.ts) comprueba que ambos archivos siguen iguales.
 */
export const MIGRATION_001_INITIAL = `
-- ---------------------------------------------------------------------
-- 1. Cuenta y perfil
-- ---------------------------------------------------------------------

-- Cuenta. En la Entrega 1 vive en el teléfono (P-57): la contraseña se
-- guarda como hash con sal (expo-crypto). Cuando exista el backend, las
-- columnas password_* pasan al servidor (bcryptjs) y salen de la app.
CREATE TABLE users (
  id                      TEXT    PRIMARY KEY,
  username                TEXT    NOT NULL,                 -- como lo escribió
  username_normalized     TEXT    NOT NULL UNIQUE,          -- minúsculas (RN-AUTH-02)
  email                   TEXT    NOT NULL UNIQUE,          -- guardado en minúsculas
  password_hash           TEXT    NOT NULL,                 -- RN-AUTH-05: nunca en claro
  password_salt           TEXT    NOT NULL,
  password_algo           TEXT    NOT NULL,                 -- p. ej. 'SHA256_SALT_V1'
  purpose                 TEXT,                             -- propósito (onboarding)
  privacy_accepted_at     TEXT    NOT NULL,                 -- C-25
  onboarding_completed_at TEXT,                             -- NULL = falta el onboarding
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1
);

-- Estado de juego (1:1 con users). Los saldos son una caché verificable
-- de los libros de movimientos (R-06).
CREATE TABLE player_profiles (
  user_id                 TEXT    PRIMARY KEY REFERENCES users(id),
  level                   INTEGER NOT NULL CHECK (level >= 0),
  xp_total                INTEGER NOT NULL CHECK (xp_total >= 0),
  mate_leaves_balance     INTEGER NOT NULL CHECK (mate_leaves_balance >= 0),      -- INT-05
  hp_half_units           INTEGER NOT NULL CHECK (hp_half_units BETWEEN 0 AND 20), -- INT-03
  perfect_streak          INTEGER NOT NULL CHECK (perfect_streak >= 0),
  avatar_appearance       TEXT,                             -- JSON; NULL = avatar fijo (E1)
  last_closed_game_date   TEXT,                             -- base de la reconciliación
  updated_at              TEXT    NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1
);

-- Catálogo fijo de 16 categorías (P-42). Se siembra abajo.
CREATE TABLE habit_categories (
  id                      TEXT    PRIMARY KEY,              -- código estable
  name                    TEXT    NOT NULL,                 -- nombre en español
  sort_order              INTEGER NOT NULL
);

-- Metas del onboarding (texto libre + categoría).
CREATE TABLE user_goals (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  text                    TEXT    NOT NULL,
  category_id             TEXT    NOT NULL REFERENCES habit_categories(id),
  sort_order              INTEGER NOT NULL DEFAULT 0,
  archived_at             TEXT,
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL
);
CREATE INDEX ix_user_goals_user ON user_goals(user_id);

-- ---------------------------------------------------------------------
-- 2. Hábitos
-- ---------------------------------------------------------------------

CREATE TABLE habits (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  origin                  TEXT    NOT NULL CHECK (origin IN ('RECOMMENDED','CUSTOM')),
  category_id             TEXT    NOT NULL REFERENCES habit_categories(id),  -- RN-HAB-09
  name                    TEXT    NOT NULL,
  target_quantity         INTEGER NOT NULL CHECK (target_quantity > 0),      -- RN-HAB-08
  unit                    TEXT    NOT NULL,
  mate_leaves_reward      INTEGER NOT NULL CHECK (mate_leaves_reward IN (0,5,10,15,20,25,30)), -- INT-04
  xp_reward               INTEGER NOT NULL CHECK (xp_reward IN (0,10,20,30,40,50)),           -- INT-04
  archived_at             TEXT,                             -- borrado lógico (R-14)
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX ix_habits_user ON habits(user_id, archived_at);

-- Programación: semanal (máscara de días) o en una fecha concreta.
-- weekdays: bit 0 = lunes … bit 6 = domingo (1..127).
CREATE TABLE habit_schedules (
  id                      TEXT    PRIMARY KEY,
  habit_id                TEXT    NOT NULL REFERENCES habits(id),
  type                    TEXT    NOT NULL CHECK (type IN ('WEEKLY','SPECIFIC_DATE')),
  weekdays                INTEGER CHECK (weekdays BETWEEN 1 AND 127),
  specific_date           TEXT,
  valid_from              TEXT    NOT NULL,
  valid_to                TEXT,                             -- NULL = sin fin
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1,
  CHECK (
    (type = 'WEEKLY'        AND weekdays IS NOT NULL AND specific_date IS NULL) OR
    (type = 'SPECIFIC_DATE' AND weekdays IS NULL     AND specific_date IS NOT NULL)
  ),
  CHECK (valid_to IS NULL OR valid_to >= valid_from)
);
CREATE INDEX ix_habit_schedules_habit ON habit_schedules(habit_id);

-- Historial de cumplimiento: una fila por hábito y jornada, con copia
-- de los valores del hábito en ese momento (R-13). Inmutable al cerrar.
CREATE TABLE habit_occurrences (
  id                          TEXT    PRIMARY KEY,
  user_id                     TEXT    NOT NULL REFERENCES users(id),
  habit_id                    TEXT    NOT NULL REFERENCES habits(id),
  game_date                   TEXT    NOT NULL,
  status                      TEXT    NOT NULL CHECK (status IN ('PENDING','COMPLETED','MISSED','CANCELLED','PAUSED')),
  habit_name_snapshot         TEXT    NOT NULL,
  category_id_snapshot        TEXT    NOT NULL,
  target_quantity_snapshot    INTEGER NOT NULL CHECK (target_quantity_snapshot > 0),
  unit_snapshot               TEXT    NOT NULL,
  mate_leaves_reward_snapshot INTEGER NOT NULL CHECK (mate_leaves_reward_snapshot IN (0,5,10,15,20,25,30)),
  xp_reward_snapshot          INTEGER NOT NULL CHECK (xp_reward_snapshot IN (0,10,20,30,40,50)),
  resolved_at                 TEXT,                         -- hora real (ventana de 10 s)
  resolution_source           TEXT    CHECK (resolution_source IN ('USER','DAY_CLOSE')),
  resolution_seq              INTEGER NOT NULL DEFAULT 0,   -- nº de marcados; forma las claves de idempotencia
  created_at                  TEXT    NOT NULL,
  updated_at                  TEXT    NOT NULL,
  version                     INTEGER NOT NULL DEFAULT 1,
  UNIQUE (habit_id, game_date),                             -- P-43: una por día
  CHECK ((status = 'PENDING') = (resolved_at IS NULL))
);
CREATE INDEX ix_occurrences_user_date ON habit_occurrences(user_id, game_date);

-- ---------------------------------------------------------------------
-- 3. Estado de ánimo (extra de la Entrega 1)
-- ---------------------------------------------------------------------

CREATE TABLE mood_entries (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  game_date               TEXT    NOT NULL,
  mood                    TEXT    NOT NULL CHECK (mood IN ('VERY_HAPPY','GOOD','NEUTRAL','DOWN','VERY_BAD')),
  recorded_at             TEXT    NOT NULL                  -- el último de la jornada manda (C-28)
);
CREATE INDEX ix_mood_user_date ON mood_entries(user_id, game_date, recorded_at);

-- ---------------------------------------------------------------------
-- 4. Libros de movimientos (SOLO INSERT). Van antes de challenges
--    porque un desafío de recuperación apunta a la vida perdida.
--    source_type + source_id son una referencia polimórfica (sin FK):
--    pueden apuntar a una ocurrencia, un desafío, una misión o un canje.
-- ---------------------------------------------------------------------

CREATE TABLE currency_transactions (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  amount                  INTEGER NOT NULL CHECK (amount <> 0),   -- con signo
  type                    TEXT    NOT NULL CHECK (type IN ('HABIT_REWARD','CHALLENGE_REWARD','MISSION_REWARD','REWARD_REDEMPTION','COSMETIC_PURCHASE','UNDO_REVERSAL')),
  source_type             TEXT    NOT NULL,
  source_id               TEXT    NOT NULL,
  idempotency_key         TEXT    NOT NULL UNIQUE,          -- INT-01, INT-16
  balance_after           INTEGER NOT NULL CHECK (balance_after >= 0),
  created_at              TEXT    NOT NULL
);
CREATE INDEX ix_currency_user ON currency_transactions(user_id, created_at);

CREATE TABLE xp_transactions (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  amount                  INTEGER NOT NULL CHECK (amount <> 0),
  type                    TEXT    NOT NULL CHECK (type IN ('HABIT_REWARD','CHALLENGE_REWARD','MISSION_REWARD','UNDO_REVERSAL')),
  source_type             TEXT    NOT NULL,
  source_id               TEXT    NOT NULL,
  idempotency_key         TEXT    NOT NULL UNIQUE,
  xp_total_after          INTEGER NOT NULL CHECK (xp_total_after >= 0),
  created_at              TEXT    NOT NULL
);
CREATE INDEX ix_xp_user ON xp_transactions(user_id, created_at);

CREATE TABLE hp_ledger_entries (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  reason                  TEXT    NOT NULL CHECK (reason IN ('MISSED_HABIT_PENALTY','RECOVERY','ZERO_HP_RECOVERY','SUPER_CHALLENGE')),
  delta_requested         INTEGER NOT NULL,
  delta_applied           INTEGER NOT NULL,                 -- 0 si ya estaba en 0 (R-25)
  source_type             TEXT    NOT NULL,
  source_id               TEXT    NOT NULL,
  idempotency_key         TEXT    NOT NULL UNIQUE,          -- INT-02
  hp_after                INTEGER NOT NULL CHECK (hp_after BETWEEN 0 AND 20), -- INT-03
  created_at              TEXT    NOT NULL
);
CREATE INDEX ix_hp_user ON hp_ledger_entries(user_id, created_at);

-- ---------------------------------------------------------------------
-- 5. Desafíos
-- ---------------------------------------------------------------------

CREATE TABLE challenges (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  kind                    TEXT    NOT NULL CHECK (kind IN ('MISSED_HABIT','RECOVERY','SUPER')),
  variant                 TEXT    CHECK (variant IN ('NORMAL','MINI')),   -- solo MISSED_HABIT
  source_occurrence_id    TEXT    UNIQUE REFERENCES habit_occurrences(id), -- INT-06 (R-15)
  source_game_date        TEXT,
  source_penalty_id       TEXT    UNIQUE REFERENCES hp_ledger_entries(id), -- 1 recuperación por vida perdida (P-12)
  habit_id                TEXT    REFERENCES habits(id),
  title                   TEXT    NOT NULL,
  target_quantity         INTEGER CHECK (target_quantity > 0),
  unit                    TEXT,
  status                  TEXT    NOT NULL CHECK (status IN ('PENDING','COMPLETED','DECLINED','EXPIRED','CANCELLED')),
  deadline_at             TEXT,                             -- created_at + 72 h (solo MISSED_HABIT)
  grace_applied           INTEGER NOT NULL DEFAULT 0 CHECK (grace_applied IN (0,1)), -- INT-18
  declined_at             TEXT,
  mate_leaves_reward      INTEGER NOT NULL CHECK (mate_leaves_reward >= 0),  -- floor(Hojas/2)
  xp_reward               INTEGER NOT NULL CHECK (xp_reward >= 0),           -- 20 % de la XP
  completed_at            TEXT,
  resolved_at             TEXT,
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1,
  -- Forma de cada tipo de desafío (RN-DES-02):
  CHECK (
    (kind = 'MISSED_HABIT'
       AND variant IS NOT NULL AND source_occurrence_id IS NOT NULL
       AND source_game_date IS NOT NULL AND habit_id IS NOT NULL
       AND deadline_at IS NOT NULL AND source_penalty_id IS NULL
       AND target_quantity IS NOT NULL AND unit IS NOT NULL)
    OR
    (kind = 'RECOVERY'
       AND variant IS NULL AND source_occurrence_id IS NULL
       AND source_penalty_id IS NOT NULL AND habit_id IS NOT NULL
       AND deadline_at IS NULL
       AND target_quantity IS NOT NULL AND unit IS NOT NULL)
    OR
    (kind = 'SUPER'
       AND variant IS NULL AND source_occurrence_id IS NULL
       AND source_penalty_id IS NULL AND deadline_at IS NULL
       AND mate_leaves_reward = 0 AND xp_reward = 0)
  )
);
CREATE INDEX ix_challenges_user_status ON challenges(user_id, status, deadline_at);
-- Un solo Superdesafío activo por usuario (INT-06). Índice parcial:
-- SQLite y PostgreSQL lo admiten; en MySQL se validará en el servicio.
CREATE UNIQUE INDEX ux_challenges_one_active_super
  ON challenges(user_id) WHERE kind = 'SUPER' AND status = 'PENDING';

-- Retos del Superdesafío: uno por hábito activo (extra de la Entrega 1).
CREATE TABLE super_challenge_tasks (
  id                      TEXT    PRIMARY KEY,
  challenge_id            TEXT    NOT NULL REFERENCES challenges(id),
  habit_id                TEXT    NOT NULL REFERENCES habits(id),
  title                   TEXT    NOT NULL,
  target_quantity         INTEGER NOT NULL CHECK (target_quantity > 0),
  unit                    TEXT    NOT NULL,
  status                  TEXT    NOT NULL CHECK (status IN ('PENDING','COMPLETED')),
  completed_at            TEXT,
  UNIQUE (challenge_id, habit_id)
);

-- ---------------------------------------------------------------------
-- 6. Misiones secundarias (máximo 3 por jornada: INT-20, en el servicio)
-- ---------------------------------------------------------------------

CREATE TABLE user_missions (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  game_date               TEXT    NOT NULL,
  category_id             TEXT    NOT NULL REFERENCES habit_categories(id),
  description             TEXT    NOT NULL,                 -- sugerida y editable (C-31)
  target_quantity         INTEGER NOT NULL CHECK (target_quantity > 0),
  unit                    TEXT    NOT NULL,
  mate_leaves_reward      INTEGER NOT NULL CHECK (mate_leaves_reward >= 0),  -- copia de 20
  xp_reward               INTEGER NOT NULL CHECK (xp_reward >= 0),           -- copia de 20
  status                  TEXT    NOT NULL CHECK (status IN ('ACCEPTED','COMPLETED','ABANDONED')),
  accepted_at             TEXT    NOT NULL,
  completed_at            TEXT,
  CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL))
);
CREATE INDEX ix_missions_user_date ON user_missions(user_id, game_date);

-- ---------------------------------------------------------------------
-- 7. Jornadas cerradas (Mapa)
-- ---------------------------------------------------------------------

CREATE TABLE daily_summaries (
  id                      TEXT    PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  game_date               TEXT    NOT NULL,
  scheduled_count         INTEGER NOT NULL CHECK (scheduled_count >= 0),
  completed_count         INTEGER NOT NULL CHECK (completed_count >= 0),
  missed_count            INTEGER NOT NULL CHECK (missed_count >= 0),
  classification          TEXT    NOT NULL CHECK (classification IN ('PERFECT','VERY_GOOD','PARTIAL','CRITICAL','NO_ACTIVITY','PAUSED')),
  last_mood               TEXT    CHECK (last_mood IN ('VERY_HAPPY','GOOD','NEUTRAL','DOWN','VERY_BAD')),
  streak_before           INTEGER NOT NULL CHECK (streak_before >= 0),  -- para deshacer (RN-CLOSE-09)
  streak_after            INTEGER NOT NULL CHECK (streak_after >= 0),
  message_id              TEXT,
  close_source            TEXT    NOT NULL CHECK (close_source IN ('MANUAL','AUTO')),
  closed_at               TEXT    NOT NULL,
  UNIQUE (user_id, game_date),                              -- INT-09
  CHECK (completed_count + missed_count <= scheduled_count)
);

-- ---------------------------------------------------------------------
-- 8. Tienda: recompensas reales (extra de la Entrega 1)
--    inventory_items (cosméticos) llega en una migración posterior.
-- ---------------------------------------------------------------------

CREATE TABLE rewards (
  id                      TEXT    PRIMARY KEY,
  owner_user_id           TEXT    REFERENCES users(id),     -- NULL = catálogo del equipo
  type                    TEXT    NOT NULL CHECK (type IN ('REAL_LIFE','COSMETIC')),
  name                    TEXT    NOT NULL,
  description             TEXT,
  cost_mate_leaves        INTEGER NOT NULL,
  min_level               INTEGER,
  cosmetic_slot           TEXT    CHECK (cosmetic_slot IN ('HEAD','FACE','NECK','CHEST','HANDS','LEGS','FEET')),
  asset_key               TEXT,
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  archived_at             TEXT,
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL,
  CHECK (type = 'REAL_LIFE' OR owner_user_id IS NULL),
  CHECK (type = 'COSMETIC'  OR (min_level IS NULL AND cosmetic_slot IS NULL)),
  CHECK (cost_mate_leaves > 0 AND (type <> 'REAL_LIFE' OR cost_mate_leaves >= 20))  -- C-30
);

CREATE TABLE reward_redemptions (
  id                      TEXT    PRIMARY KEY,              -- = operationId
  user_id                 TEXT    NOT NULL REFERENCES users(id),
  reward_id               TEXT    NOT NULL REFERENCES rewards(id),
  name_snapshot           TEXT    NOT NULL,
  cost_snapshot           INTEGER NOT NULL CHECK (cost_snapshot > 0),
  currency_transaction_id TEXT    NOT NULL UNIQUE REFERENCES currency_transactions(id),
  redeemed_at             TEXT    NOT NULL
);

-- ---------------------------------------------------------------------
-- 9. Semilla: categorías (P-42)
-- ---------------------------------------------------------------------

INSERT INTO habit_categories (id, name, sort_order) VALUES
  ('EXERCISE',          'Ejercicio',                 1),
  ('STUDY',             'Estudio',                   2),
  ('READING',           'Lectura',                   3),
  ('ART',               'Arte y creatividad',        4),
  ('MINDFULNESS',       'Mindfulness',               5),
  ('HEALTH',            'Salud y alimentación',      6),
  ('SELF_CARE',         'Autocuidado',               7),
  ('HOME',              'Hogar y orden',             8),
  ('FINANCE',           'Finanzas personales',       9),
  ('SOCIAL',            'Relaciones y vida social', 10),
  ('WORK',              'Trabajo y productividad',  11),
  ('SPIRITUALITY',      'Espiritualidad',           12),
  ('DIGITAL_WELLBEING', 'Bienestar digital',        13),
  ('HOBBIES',           'Ocio y hobbies',           14),
  ('COMMUNITY',         'Voluntariado y comunidad', 15),
  ('OTHER',             'Otro',                     16);
`;
