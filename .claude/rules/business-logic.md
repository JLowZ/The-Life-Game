# Reglas de lógica de negocio — The Life Game

Se aplican siempre que se implemente, modifique o pruebe una regla del juego.

**Fuente única de verdad:** `docs/BUSINESS_RULES.md` (`RN-…`, `INT-…`, `ESC-…` y máquinas de estado). Estado de las decisiones: `docs/DECISIONS.md`. Si este archivo y esos documentos difieren, **mandan los documentos**: avisa de la diferencia.

## 1. Principios

1. **Desacoplamiento:** las reglas viven en `app/src/domain/` como **funciones puras de TypeScript**, sin React, Expo, SQLite, `fetch` ni `Date.now()`.
2. **Reloj inyectado:** toda función que dependa del tiempo recibe `now`.
3. **Sin números mágicos:** las constantes salen de `src/config/game.ts` (R-21):

   | Constante | Valor |
   |---|---|
   | `MAX_HP_HALF_UNITS` | 20 |
   | `DAY_CUTOFF_HOUR` | 4 |
   | `CHALLENGE_DURATION_HOURS` | 72 |
   | `GRACE_HOURS` | 12 |
   | `UNDO_WINDOW_SECONDS` | 10 |
   | `ALLOWED_LEAVES` | [0, 5, 10, 15, 20, 25, 30] |
   | `ALLOWED_XP` | [0, 10, 20, 30, 40, 50] |
   | `CHALLENGE_XP_PERCENT` | 20 |
   | `MISSION_REWARD` | { leaves: 20, xp: 20 } |
   | `MAX_DAILY_MISSIONS` | 3 |
   | `MIN_REAL_REWARD_COST` | 20 |
   | `NORMAL_CHALLENGE_PERCENT` | 50 |
   | `MINI_CHALLENGE_PERCENT` | 10 |
   | Curva de niveles | XP total para el nivel *n* = `40·n² + 60·n` |
   | Umbrales de clasificación | 100 / 85 / 40 |

4. **Efectos explícitos:** el dominio devuelve **decisiones y efectos** (`{ ok, effects: [...] }`) y los servicios los aplican en una transacción.
5. **Trazabilidad:** cita el código de la regla (`// RN-DES-10`) en el código y en las pruebas.
6. **El servidor revalida** las operaciones críticas desde la Fase 11. Excepción temporal: Entrega 1 con respaldo por instantánea (CT-21).

## 2. Decisiones abiertas: no inventar

Si la tarea necesita algo marcado **Abierta** en `DECISIONS.md` §3.2, **detente y pregunta**. Hoy no queda ninguna decisión abierta que afecte a la lógica del juego.

Si el equipo aprueba un valor provisional, regístralo antes en `DECISIONS.md`.

## 3. Reglas clave (resumen)

### Hábitos y jornada
- Cada hábito es **medible** (`targetQuantity` + `unit`), tiene **categoría**, **Hojas ∈ {0, 5, …, 30}** y **XP ≤ 50**. Estos límites también se aplican a los recomendados (RN-HAB-02, RN-HAB-08, RN-HAB-09).
- Una ocurrencia por hábito y jornada, con copia de los valores.
- **Editar:** las futuras se regeneran, la de hoy conserva sus valores y las cerradas no cambian (RN-HAB-05, RN-HAB-06).
- `gameDate`: si la hora local es anterior a las 04:00, cuenta como el día anterior. Solo se marca con la jornada abierta **y HP > 0**.
- **Deshacer en 10 s:** revierte por completo con movimientos compensatorios. Después, el registro es definitivo (RN-DAY-07).

### Economía
- **Hábito cumplido:** +Hojas +XP, una vez por marcado (`habit-reward:<occurrenceId>:<resolutionSeq>`; ver `DATA_MODEL.md` §5).
- **Desafío completado** (por incumplimiento, normal o mini, o de recuperación): `floor(Hojas / 2)` + **20 % de la XP** del hábito (`challenge-reward:<challengeId>`). **No** cambia la ocurrencia ni el porcentaje (RN-DES-06).
- **Misión secundaria:** +20 Hojas +20 XP, una vez; **máximo 3 por jornada** sin contar las abandonadas. Se abandona a mano o al cerrar la jornada, sin coste; no cuenta en el Mapa (P-58). La sugerencia es editable (RN-MIS-04).
- **Recompensa real:** costo ≥ 20; canjes ilimitados.
- El saldo nunca es negativo. Gastar no toca la XP ni el HP. La XP nunca baja. Nivel inicial 0; nivel derivado de la XP.

### HP
- Unidades **0..20** ("20 vidas internas" = 10 corazones; 1 unidad = medio corazón), siempre limitadas a ese rango.
- Cada vida perdida genera **un desafío de recuperación** del mismo hábito (sin plazo), que devuelve +1 unidad (`UNIQUE(source_penalty_id)`).
- **−1 unidad** solo al **vencer** un desafío por incumplimiento sin completar, una vez por ocurrencia (`hp-penalty:<occurrenceId>`).
- Al llegar a 0: **un** Superdesafío.
- **A 0 HP**, completar cualquier otro desafío da +1 unidad y **cancela el Superdesafío** (RN-HP-10).
- Superdesafío completado (todas sus tareas): HP = 20.

### Estado de ánimo y variante
| Último ánimo de la jornada | Variante | Tono |
|---|---|---|
| `VERY_HAPPY`, `GOOD` | `NORMAL` | Propósito y aviso de la posible pérdida |
| `NEUTRAL` o sin registro | `NORMAL` | Neutral |
| `DOWN`, `VERY_BAD` | `MINI` | Empático, sin culpa |

- El ánimo se puede cambiar sin límite. El **último** define la variante de los desafíos **pendientes de la jornada abierta**: cambiar de ánimo cambia la variante del **mismo** desafío, nunca crea otro. Al cerrar la jornada, la variante queda fija.
- El Mapa guarda el último ánimo de la jornada.

### Desafíos
- **Uno** por ocurrencia incumplida (`UNIQUE(source_occurrence_id)`). El normal y el mini son **el mismo desafío** con distinta variante.
- **Plazo:** `created_at + 72 h`, sea el incumplimiento manual o automático (el automático cuenta desde el cierre lógico de las 04:00).
- **Gracia:** si `now > deadline` en la primera reconciliación tras un periodo con la app cerrada y `!grace_applied`, entonces `deadline = now + 12 h` y `grace_applied = true` (una sola vez).
- **Completar** exige `now < deadline` y `PENDING` (RN-DES-08). Es por **autodeclaración** del criterio medible.
- **Rechazar el mini:** pasa a `DECLINED`. En plazo, el usuario puede pasar al `NORMAL` o deshacer el rechazo. Si al vencer no completó ninguno, pierde 1 unidad.
- **Tamaño:** el normal es el 50 % de la cantidad y el mini el 10 % (redondeo hacia arriba, mínimo 1). La recuperación usa el tamaño normal.
- **Superdesafío:** una `SuperChallengeTask` por **hábito activo**, sin plazo y sin Hojas ni XP.
- **Prevenir ≠ recuperar** (INT-13).

### 0 HP (RN-NAV-04, INT-17)
- **Bloqueado:** programar, marcar hábitos, comprar o canjear y misiones secundarias.
- **Permitido:** equipar y personalizar el avatar, el Superdesafío, los desafíos que devuelven HP y consultar.
- Las jornadas que transcurren a 0 HP quedan **"En pausa"** (`PAUSED`): fuera del porcentaje, sin desafíos y saltadas en la racha.

### Mapa y cierre
- Porcentaje = cumplidos (`c`) / programados (`p`) × 100, **sin redondear**, con aritmética entera:
  - `c === p` → `PERFECT`;
  - `c*100 >= 85*p` → `VERY_GOOD`;
  - `c*100 >= 40*p` → `PARTIAL`;
  - si no → `CRITICAL`;
  - `p === 0` → `NO_ACTIVITY` ("Sin actividades programadas").
- **Racha:** jornadas `PERFECT` consecutivas; `NO_ACTIVITY` se salta.
- `closeGameDay`: los pasos de RN-CLOSE-02 en orden, en una transacción e idempotente (`UNIQUE(user_id, game_date)`). Después, el respaldo (si existe).
- `undoDayClose`: solo para un cierre `MANUAL` y antes de las 04:00. Revierte únicamente los efectos de ese cierre (RN-CLOSE-09, INT-19).
- La reconciliación procesa todas las jornadas vencidas en orden cronológico.

### Tienda
- **Recompensas reales:** costo > 0, canjes ilimitados; validar el saldo en cada uno.
- **Cosméticos (después de la Entrega 1):** nivel ≥ mínimo **y** saldo suficiente; sin duplicados; equipar es gratis; uno por ranura (HEAD, FACE, NECK, CHEST, HANDS, LEGS, FEET).

## 4. Pruebas obligatorias

- **Límites:** 0 y 20 unidades; Hojas 0, 5, 12 (inválido), 30 y 35 (inválido); XP 50 y 51; 03:59 y 04:00; 72 h exactas; gracia; deshacer a los 10 s; 100, 85, 40 y 84,6 %.
- **Idempotencia:** acreditar, recompensar un desafío, penalizar, cerrar una jornada, canjear, comprar y completar una misión, cada uno **dos veces**.
- **Estados:** los cinco ánimos más el caso sin registro; cambio de ánimo con un desafío pendiente; transiciones válidas e inválidas (`BUSINESS_RULES.md` §16).
- Los `ESC-xx` de la fase y las `INT-xx` afectadas.

## 5. Terminología

"Desafíos", "Mini desafío", "Desafío de recuperación", "Superdesafío", "Hojas de mate", "Día Finalizado", "Misiones del día", "Misiones secundarias". **Nunca** "castigo".

Identificadores según `CLAUDE.md` §8.

## 6. Cambiar una regla

`CLAUDE.md` §13: aprobación → `DECISIONS.md` → `BUSINESS_RULES.md` y documentos derivados → pruebas → código. **Nunca** cambies una regla solo en el código.
