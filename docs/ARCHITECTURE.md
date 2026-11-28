# Arquitectura técnica — The Life Game

> Equipo TechPhic · v1.1 (2026-11-25, revisión de la Fase 0)
>
> `C-xx` = confirmado · `R-xx` = recomendación (ver su estado en `DECISIONS.md`) · `P-xx` = decisión del equipo.

## 1. Visión general

- **App** (Expo + React Native + **TypeScript**, solo Android): reglas del juego, datos en SQLite y funcionamiento sin conexión.
- **Backend** (Node.js + Express, **JavaScript**): cuentas, sesiones y **respaldo**.
- **Base de datos** del servidor: MySQL en XAMPP (servidor del profesor).

```text
┌──────────────────────────── App Android (Expo SDK 58 · TypeScript) ─────────────────────────┐
│ RUTAS (Expo Router)   src/app/…  → envoltorios delgados de las pantallas                      │
│ PANTALLAS/COMPONENTES src/screens · src/components (pixel art, HUD, corazones…)               │
│        │ hooks                                                                               │
│ ESTADO (Zustand)      src/state — proyección de SQLite para la interfaz                       │
│        │                                                                                     │
│ SERVICIOS             completeHabit · markHabitMissed · undoMark · closeGameDay ·             │
│ (casos de uso)        completeChallenge · redeemReward · buyCosmetic · backupNow …            │
│        │                     │                               │                               │
│ DOMINIO (puro)        PERSISTENCIA                     API                                    │
│ src/domain            SQLite (repositorios)            src/api (auth, backup)                 │
│                       SecureStore (token)                     │                               │
└───────────────────────────────────────────────────────────────┼──────────────────────────────┘
                                                                │ HTTP (LAN) / HTTPS (producción) · JSON · /api/v1
┌──────────────────────────── Backend (Node.js 24 · Express 5 · JavaScript CommonJS) ─────────┐
│ routes → middleware (auth, validación, errores) → controllers → services → repositories     │
└───────────────────────────────────────────────────────────────┬──────────────────────────────┘
                                                                │ mysql2 (pool, transacciones)
                                             MySQL / MariaDB (XAMPP + phpMyAdmin) → futuro: Supabase (P-51)
```

## 2. Decisiones técnicas vigentes

| Tema | Decisión | Referencia |
|---|---|---|
| Plataforma | Solo Android. Expo Go para la entrega; APK opcional. | C-03, P-20 |
| Lenguaje | TypeScript (app) · JavaScript CommonJS (backend; TypeScript después) | P-22, P-52 |
| Navegación | Expo Router | P-21 |
| Estado | Zustand | P-23 |
| Persistencia local | `expo-sqlite` (datos), `expo-secure-store` (token), kv-store o AsyncStorage (preferencias) | R-02 a R-04 |
| Pruebas | Jest: `jest-expo` (app) · Jest + supertest (backend) | P-24 |
| Autenticación | bcryptjs + token opaco (hash en `auth_sessions`, 30 días) | P-26, R-16 |
| Respaldo | Instantánea completa (`PUT`/`GET /api/v1/backup`) en la Entrega 1 | R-29 |
| Base de datos | MySQL en XAMPP; SQL portable a PostgreSQL | C-02, R-30, P-51 |
| Migraciones | SQL numerados (servidor); `PRAGMA user_version` (SQLite) | P-45 |
| Estética | Pixel art basado en el **logo** y los bocetos del equipo; el acabado va después de la lógica. En la Entrega 1, avatar fijo y sin cosméticos | C-22, C-20 |
| Repositorio | Monorepo público `JLowZ/The-Life-Game` | C-21 |

## 3. Estado actual del repositorio (2026-11-27)

| Elemento | Estado |
|---|---|
| Raíz | **Monorepo git** conectado a `https://github.com/JLowZ/The-Life-Game`. `main` + rama `feature/fases-1-a-6-base` (Fases 1–6, subida a GitHub). Harness (`CLAUDE.md`, `docs/`, `.claude/rules/`), `LICENSE`, `.gitignore`, `.gitattributes`, `app/` y `backend/`. |
| `app/` | **Fases 3 a 9 hechas y probadas:** TypeScript estricto + Expo Router (SDK 58, RN 0.88.1, React 19.3.0). SQLite (migraciones `001` y `002`), SecureStore, Zustand, Jest y ESLint. Registro y sesión locales, HUD, hábitos, desafíos, misiones secundarias, cierre de jornada y Mapa. Siguiente: `docs/NEXT_STEPS.md`. |
| `backend/` | Dependencias instaladas. Sin scripts ni entrada (Fase 2, después de la entrega, P-57). |

## 4. Frontend (`app/`)

### 4.1. Estructura (real, 2026-11-27)

```text
app/src/
├── app/                      RUTAS de Expo Router (solo envoltorios de una línea)
│   ├── _layout.tsx           SQLiteProvider + migración; restaura la sesión; Stack.Protected por estado
│   ├── (auth)/               welcome, login, register, onboarding (asistente de registro, R-34)
│   ├── (tabs)/               _layout (HUD como cabecera + reconciliación), index, map, challenges, shop
│   ├── settings.tsx          Ajustes (P-61)
│   ├── habits.tsx            lista de hábitos (sin enlace desde la Fase 9: "Mis hábitos" vive en el Mapa)
│   └── habit-form.tsx        crear/editar hábito (?id= para editar)
├── screens/                  composición de cada pantalla
├── components/               presentacionales (PixelButton, Hud, HeartsBar, XpBar, OccurrenceCard,
│                             ChallengeCard, MissionModal, MapCalendar, DaySummaryCard, ScheduleTable…).
│                             HudHeader es el único contenedor.
├── state/                    Zustand: useSessionStore, usePlayerStore, useHabitsStore,
│                             useChallengesStore, useRegistrationDraftStore (solo memoria)
├── services/                 casos de uso (una transacción cada uno) + deps.ts / platformDeps.ts
├── domain/                   reglas puras: auth, onboarding, gameDay, level, hp, habits, schedule,
│                             habitMarking, challenges, missions, dayClose, calendar, categories, types
├── database/                 la única capa con SQL: migrate, migrations/, repositories/, transaction,
│                             secureSession, preferencesStore (kv-store), testing/
├── content/                  textos: authTexts (aviso de privacidad), habitTexts, challengeTexts, dayTexts
└── config/                   game.ts (R-21), audio.ts, theme.ts
```

`api/` y `utils/` se crearán cuando hagan falta (Fase 2).

**Dependencias entre capas:**

```text
app (rutas) → screens/components → state → services → domain
                                              ↘ database, api
```

`domain` no importa nada; los componentes nunca importan `database` ni `api`.

### 4.2. Navegación (Expo Router)

- `useSessionStore.status`: `LOADING` → `SIGNED_OUT` | `NEEDS_ONBOARDING` | `SIGNED_IN`. Al abrir, `restoreSession` lee el `activeUserId` de SecureStore (P-57).
- El `_layout.tsx` raíz y el de `(auth)` usan **`Stack.Protected`**: cambiar el estado basta para que Expo Router muestre la ruta correcta; nadie navega a mano al iniciar o cerrar sesión.
- ⚠️ **Todo `Stack.Protected` lleva `redirectTo` con una ruta concreta.** En expo-router 58 el destino por defecto puede ser un grupo sin `index` (`/(auth)`), que se resuelve como `/` (protegida): bucle infinito y pantalla negra.
- `(tabs)/_layout.tsx` pinta el **HUD** como cabecera de las cuatro pestañas, con el engranaje de Ajustes.
- A 0 HP, las acciones bloqueadas se deshabilitan con una explicación (P-14).

### 4.3. Estado (Zustand)

- **SQLite es la fuente de verdad.** Los stores son una proyección para la interfaz.
- Los servicios recargan los stores al terminar: `refreshPlayerProfile`, `refreshToday`, `refreshChallenges`. Al cerrar sesión se vacían (`clearPlayerProfile`, `clearToday`, `clearChallenges`).
- Los valores derivados (corazones, progreso de XP, tiempo restante) **no** se guardan: los calcula el dominio al pintar.
- Los componentes leen con **selectores** (`usePlayerStore(s => s.profile)`).

### 4.8. Servicios y dependencias inyectadas

- Cada servicio recibe `AppDeps = { db, crypto, session, now }` (`services/deps.ts`). En el teléfono: expo-sqlite, expo-crypto, SecureStore y la hora del sistema (`platformDeps.ts`, `useAppDeps`). En las pruebas: `node:sqlite` en memoria, `node:crypto`, sesión en memoria y un **reloj controlable** (`services/testing/createTestDeps.ts`).
- `services/ledgerEffects.ts` aplica Hojas, XP y HP (movimientos con clave de idempotencia + caché del perfil) dentro de una transacción ya abierta. Lo usan hábitos, desafíos y misiones.
- `services/reconciliationService.ts` (`reconcile`) se ejecuta al entrar con una cuenta, al volver al primer plano (`appOpened: true`, con gracia) y al enfocar Inicio o Desafíos. La Fase 9 le añadirá el cierre de jornadas.
- Ocurrencias con horizonte de 0 días (R-26): solo existe la fila de la jornada actual.

### 4.4. Persistencia local

- `expo-sqlite`: todas las tablas del juego (`DATA_MODEL.md` §4). Cada caso de uso es **una transacción**.
- `expo-secure-store`: el token de sesión (Entrega 1: el `activeUserId`, P-57). Nunca la contraseña.
- **Transacciones:** `src/database/transaction.ts` (`runInTransaction`) pone en cola `withTransactionAsync`. No se usa `withExclusiveTransactionAsync` porque abre otra conexión donde no rige `PRAGMA foreign_keys` (documentación de expo-sqlite, SDK 58). Toda escritura del juego pasa por `runInTransaction`.
- **Migraciones:** `src/database/migrate.ts` con `PRAGMA user_version`; la `001` es copia de `docs/schema/sqlite_v1.sql` (una prueba vigila que sigan iguales) y la `002` añade la categoría `PERSONAL_DEVELOPMENT` (P-59). Una migración publicada nunca se edita: se añade otra.
- **Pruebas de la base de datos:** `src/database/testing/createTestDatabase.ts` implementa la misma interfaz con `node:sqlite` (Node 24), así Jest prueba contra SQLite real.
- Preferencias no críticas (volumen de la música): kv-store de `expo-sqlite` (`database/preferencesStore.ts`), verificado en SDK 58. No se respaldan.
- Las dependencias se instalan **siempre** con `npx expo install` y **tras aprobación**. Todas las citadas funcionan en Expo Go.

### 4.5. Comunicación con la API

- `EXPO_PUBLIC_API_URL` = IP LAN del PC que ejecuta el backend (por ejemplo, `http://192.168.1.50:3000`). Sin secretos.
- Cabecera `Authorization: Bearer <token>`.
- Sin conexión, la app sigue funcionando. El respaldo se reintenta y la interfaz indica discretamente si hay datos sin respaldar.

### 4.6. Notificaciones (después de la entrega, P-47)

Un recordatorio local entre las 18:00 y las 20:00 si hay hábitos pendientes. Antes de implementarlo, hay que verificar en la documentación de SDK 58 qué soporta `expo-notifications` en Expo Go para Android.

### 4.7. APK (opcional en la Entrega 1)

Se genera con EAS Build (perfil `preview`, APK). Requiere una cuenta de Expo.

**Atención:** Android bloquea el **HTTP sin cifrar** en las compilaciones de release. Para apuntar a un backend `http://` de la LAN hay que permitirlo explícitamente con el config plugin que indique la documentación de SDK 58, solo para pruebas. Lo correcto es HTTPS.

## 5. Backend (`backend/`)

### 5.1. Estructura

```text
backend/
├── package.json            scripts "dev" (nodemon) y "start"; main → src/server.js   [Fase 2]
├── .env / .env.example     PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME      [Fase 2]
├── database/migrations/    001_users.sql, 002_auth_sessions.sql, 003_user_backups.sql… [Fase 2, tras aprobación]
├── tests/                  Jest + supertest
└── src/
    ├── app.js              app de Express (middleware, rutas, errores); sin listen
    ├── server.js           arranque; escucha en 0.0.0.0:PORT
    ├── config/             entorno + pool de mysql2
    ├── routes/ middleware/ controllers/   [existen]
    ├── services/ repositories/ validators/ utils/
```

### 5.2. API de la Entrega 1 (indicativa; se cierra en la Fase 1)

| Método y ruta | Uso |
|---|---|
| `GET /api/v1/health` | Comprueba la conexión con la base de datos. |
| `POST /api/v1/auth/register` | Crea la cuenta (usuario y correo únicos) y devuelve el token. |
| `POST /api/v1/auth/login` | Inicia sesión con `identifier` (usuario **o** correo) + contraseña. Devuelve el token. |
| `POST /api/v1/auth/logout` | Revoca la sesión. |
| `GET /api/v1/me` | Datos de la cuenta. |
| `PUT /api/v1/backup` | Sube la instantánea (JSON + `schemaVersion` + `checksum`). |
| `GET /api/v1/backup` | Descarga la última instantánea. |

Convenciones (R-19):

- JSON en camelCase.
- Error uniforme: `{ error: { code, message, details } }`.
- Códigos 400 / 401 / 403 / 404 / 409 / 422 / 500.

### 5.3. Seguridad

- bcryptjs para las contraseñas.
- Token opaco de 32 bytes aleatorios; en la base de datos solo se guarda su SHA-256.
- Errores de inicio de sesión genéricos.
- SQL **solo parametrizado**.
- Límite de tamaño de las peticiones (la instantánea puede pesar algunos cientos de KB: fijar un límite razonable, por ejemplo 5 MB).
- CORS restringido.
- `.env` nunca se versiona.
- **El repositorio es público:** **ningún secreto** ni dato real de usuarios en el código, la documentación o los commits.

### 5.4. Errores y transacciones

- Express 5 envía solo los errores de los manejadores `async` al middleware de errores. Hay un único middleware de errores y otro para 404.
- Las operaciones de varios pasos van en una transacción con una conexión dedicada (`beginTransaction` / `commit` / `rollback` / `release`).

## 6. Base de datos

- **Desarrollo y entrega:** XAMPP con MySQL (posiblemente MariaDB, R-22) y phpMyAdmin. El servidor es el que aporta el profesor. Falta confirmar **dónde se ejecuta Node** (P-36).
- **Portabilidad (R-30):** SQL estándar para facilitar la posible migración a **Supabase (PostgreSQL)** con servidor propio (P-51). La capa de repositorios aísla el SQL.
- **Migraciones:** scripts numerados en `backend/database/migrations/`, que se aplican en orden (en phpMyAdmin o con un script). **Ninguna operación destructiva sin autorización.**
- Bases separadas para desarrollo y pruebas.

## 7. Arquitectura híbrida y respaldo

### 7.1. Entrega 1 (R-29)

> ⚠️ **Actualización 2026-11-26 (P-57):** la Entrega 1 **no lleva backend**. Registro e inicio de sesión son locales (SQLite) y no hay respaldo. Este flujo de respaldo se implementa **después** de la entrega, cuando exista el backend.

```text
acción → dominio valida → transacción SQLite → Zustand se refresca → HUD
cierre de jornada / cerrar sesión → backupNow(): serializa los datos → PUT /api/v1/backup
inicio de sesión en un dispositivo sin datos → GET /api/v1/backup → restaurar en SQLite
```

- **Un dispositivo por cuenta** (P-18), así que no hay conflictos.
- Al cerrar sesión: si el respaldo falla, se avisa y **no se borra** nada local (RN-AUTH-08).
- **Limitación aceptada:** el servidor no revalida cada operación crítica (CT-21).

### 7.2. Fase 11 (objetivo final)

Cola de salida con `operationId`, `processed_operations` en el servidor, revalidación de las operaciones críticas, reintentos con espera exponencial y tablas del juego sincronizadas.

## 8. Tiempo, jornada y reconciliación

```text
gameDate(instante, zona del teléfono):
    si hora local < 04:00 → fecha local − 1 día; si no → fecha local
closeAt(D) = (D + 1) a las 04:00 en hora local

challengeDeadline(creación) = creación + 72 h
gracia: si en la primera reconciliación tras un periodo con la app cerrada now > deadline
        y !grace_applied → deadline = now + 12 h; grace_applied = true
```

**Reconciliación** (al abrir la app, al volver al primer plano y al recuperar la conexión):

1. Cierra en orden cada jornada desde `last_closed_game_date + 1` hasta ayer. Es idempotente.
2. Aplica la gracia a los desafíos vencidos con la app cerrada.
3. Vence los desafíos con `deadline ≤ now` (−1 unidad cada uno, mínimo 0).
4. Activa el Superdesafío si se llega a 0 HP.
5. Respalda.

El reloj `now` se **inyecta** siempre en el dominio, para poder probarlo.

## 9. Operaciones críticas (una transacción SQLite cada una)

| Caso de uso | Validaciones | Efectos |
|---|---|---|
| `completeHabit` | Jornada abierta, `PENDING`, HP > 0 | `COMPLETED`; `resolution_seq + 1`; +Hojas +XP (`habit-reward:<id>:<seq>`); nivel |
| `markHabitMissed` | Ídem | `MISSED`; un desafío con la variante según el último ánimo y plazo de 72 h |
| `undoMark` | ≤ 10 s desde `resolved_at` | Vuelve a `PENDING`; movimientos compensatorios; borra el desafío si aún no tiene efectos |
| `setMood` | — | Nuevo `MoodEntry`; actualiza la variante de los desafíos `PENDING` de la jornada abierta |
| `declineMini` / `switchToNormal` / `undoDecline` | En plazo | Cambia el estado o la variante (un solo desafío) |
| `completeChallenge` | `PENDING`, `now < deadline` (si tiene plazo) | `COMPLETED`; `MISSED_HABIT` y `RECOVERY`: +½ Hojas (hacia abajo) +20 % XP (`challenge-reward:`); `RECOVERY`: +1 unidad; a 0 HP: +1 unidad y `SUPER` → `CANCELLED` |
| `completeSuperTask` | Tarea `PENDING` | Si es la última tarea: HP = 20 |
| `expireOverdueChallenges` | `deadline ≤ now`, sin resolver | `EXPIRED`; −1 unidad (`hp-penalty:`); crea **un desafío de recuperación** vinculado a esa vida perdida |
| `closeGameDay` | No cerrada | Los pasos de RN-CLOSE-02; las jornadas a 0 HP quedan "En pausa" |
| `undoDayClose` | Cierre `MANUAL` y `now < closeAt(gameDate)` | Las ocurrencias con `DAY_CLOSE` vuelven a `PENDING`; se borran sus desafíos y el resumen; se restaura la racha (RN-CLOSE-09) |
| `redeemReward` | Saldo, HP > 0, costo ≥ 20 | Movimiento y registro del canje |
| `buyCosmetic` / `equipCosmetic` | Después de la Entrega 1 | Movimientos e inventario |
| `acceptMission` / `completeMission` | HP > 0; **máximo 3 por jornada** | +20 Hojas +20 XP una vez |

## 10. Entorno de desarrollo (Windows 11)

1. **XAMPP:** iniciar MySQL (y Apache para phpMyAdmin), o usar el servidor del profesor (P-36).
2. **Backend:** `cd backend` → `npm run dev` (desde la Fase 2).
3. **App:** `cd app` → `npx expo start` → escanear el QR con **Expo Go en Android**.
   - El teléfono y el PC deben estar en la misma Wi-Fi.
   - `EXPO_PUBLIC_API_URL` con la IP de `ipconfig`.
   - El Firewall de Windows debe permitir Node en redes privadas.
   - Sin la misma Wi-Fi (p. ej., con datos móviles): `npx expo start --tunnel`.
   - **Si Expo Go muestra `Cannot find native module 'ExpoSQLite'`** (y en la terminal salen avisos `Route "…" is missing the required default export`): casi siempre es la **caché de Metro**, no el código. `Ctrl+C` → `npx expo start -c`. Pasó el 2026-11-28 tras reabrir la sesión con `--tunnel`; con `-c` se arregló. Los avisos de rutas son un efecto en cadena del primer error. Solo si persiste, comprobar en Expo Go → Ajustes que admite el **SDK 58** (Play Store puede actualizarla; desactivar la actualización automática antes de una entrega). Reinstalar Expo Go borra los datos locales.
4. **Ruta del proyecto sin espacios ni `&`** (`C:\Users\USUARIO\Desktop\Estudio\TheLifeGame`, desde el 2026-11-26). Antes estaba en `Workgroup & Scrum` y el `&` rompía `npx` en Windows: los `.cmd` de `node_modules/.bin` cortan la ruta en el `&`. **Cada miembro del equipo debe clonar el repositorio en una ruta sin `&`.**
5. Tras clonar: `cd app` → `npm ci` (usa `app/package-lock.json` y `app/.npmrc`).
6. **`app/.npmrc` con `legacy-peer-deps=true`:** `expo-router` arrastra `@radix-ui` (solo web), que pide `react-dom` ≥ 19.3.1, y SDK 58 fija React 19.3.0. Como la app es solo Android, no se instalan dependencias pares de web. Sin este archivo, `npm install` falla con `ERESOLVE`. El paquete de Android se compiló sin `react-dom` (`expo export --platform android`).

## 11. Estrategia de pruebas

| Nivel | Qué cubre | Herramienta |
|---|---|---|
| Dominio | Todas las reglas, invariantes y escenarios ESC-xx | Jest (`jest-expo`) |
| Servicios de la app | Casos de uso, idempotencia, límites de tiempo e INT-14 (saldos = suma de movimientos) | Jest con SQLite real en memoria y reloj controlable |
| Backend | Autenticación, respaldo, validación y errores | Jest + supertest con una base de datos de pruebas |
| Manual | Flujos completos en Expo Go (Android) | `docs/NEXT_STEPS.md` (pruebas pendientes de la fase actual) |

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| **Plazo de 5 días para la Entrega 1** | Alcance acotado (C-20), plan por días en el roadmap, recortes priorizados |
| El sistema operativo no ejecuta la app a las 4:00 | Reconciliación idempotente |
| El servidor no revalida en la Entrega 1 | Aceptado temporalmente (CT-21); Fase 11 |
| Reloj del teléfono manipulado | Aceptado en la v1 (la honestidad es del usuario); validación en el servidor en la Fase 11 |
| Repositorio público | Sin secretos; `.gitignore`; correo de los commits (ver `GIT_WORKFLOW.md`) |
| MariaDB frente a MySQL frente a PostgreSQL | SQL portable (R-30), verificar la versión (R-22) |
| ¿Dónde se ejecuta Node? | P-36 |
| HTTP sin cifrar en el APK | HTTPS o configuración solo para pruebas (§4.7) |
| Licencias de arte, fuentes y mensajes | Solo contenido propio, CC0 u OFL (RN-MSG-05, P-38) |

## 13. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-25 | Versión inicial (Fase 0). |
| 2026-11-28 | §10: solución al error `Cannot find native module 'ExpoSQLite'` (caché de Metro, `npx expo start -c`). |
| 2026-11-28 | Fases 8 y 9: `dayCloseService` (cierre manual y automático, deshacer), `mapService`; la reconciliación cierra primero las jornadas pendientes, va en cola y trata la primera llamada tras arrancar como apertura (R-37). |
| 2026-11-27 | §3, §4.1–4.3 y §4.8 actualizados con la estructura real de las Fases 3 a 7. |
| 2026-11-27 | Fase 7: `challengeService` (crear, completar, gracia y vencimiento), `missionService`, `reconciliationService` (al abrir, al volver al primer plano y al entrar en Inicio/Desafíos) y `ledgerEffects` (movimientos de Hojas, XP y HP compartidos). |
| 2026-11-27 | Fase 6: ocurrencias con horizonte de 0 días (R-26); servicios `habitService` y `occurrenceService`; reloj inyectado en los servicios (`services/deps.ts`). |
| 2026-11-26 | Fase 1: Entrega 1 sin backend (P-57); clave `habit-reward` con `<seq>` (`DATA_MODEL.md` §5). |
| 2026-11-26 | Fase 3: estado de `app/`, transacciones en cola, migraciones, pruebas con `node:sqlite`, problemas del `&` en la ruta y `.npmrc`. |
| 2026-11-26 | Proyecto movido a `Desktop\Estudio\TheLifeGame`: `npx` vuelve a funcionar; se retira la tabla de comandos alternativos. |
| 2026-11-25 | v1.2: operaciones `undoDayClose`, recuperación por vida perdida, recompensas de los desafíos, límite de misiones; cosméticos fuera de la Entrega 1. |
| 2026-11-25 | v1.1: TypeScript + Expo Router + Zustand en la app; Android; backend JavaScript con token opaco y respaldo por instantánea; API de la Entrega 1; SQL portable; plazo de 72 h y gracia; APK y notificaciones. |
