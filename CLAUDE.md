# CLAUDE.md — The Life Game

Contexto principal de Claude Code para este repositorio. Se carga al trabajar desde la raíz del proyecto.

## 1. Identidad y propósito

**The Life Game** es una aplicación móvil **Android** de **gestión de hábitos** con mecánicas **RPG** y estética **pixel art**. Incluye:

- hábitos medibles por categorías y un calendario gamificado (**Mapa**);
- un avatar con niveles (**XP**), moneda virtual (**Hojas de mate**) y vidas (**HP**);
- **Desafíos** (normal, mini, recuperación, Superdesafío) y misiones secundarias;
- mensajes que se adaptan al **estado de ánimo**.

> *La constancia no significa avanzar siempre con la misma intensidad. Incluso un pequeño escalón representa progreso.*

**Equipo TechPhic:** Juan José López, David Pachón y Dylan Arredondo. Es un proyecto estudiantil con ambición de salir al mercado.

El equipo está **aprendiendo**: explica las decisiones técnicas con claridad y precisión. Responde y documenta en **español**.

## 2. Estado actual

- **Fase 0 cerrada el 2026-11-25** (dos rondas de revisión). Casi todas las decisiones están resueltas. Siguen abiertas, sin bloquear el desarrollo: P-36 (dónde corre Node), P-38 (arte a partir del logo), P-40 (correo de soporte) y P-56 (licencia y universidad).
- **Próximo hito: Entrega 1, lunes 30-nov-2026. Alcance mínimo (C-20):** login, crear hábitos y asignarlos a días, HUD, recompensas por hábitos, desafíos por incumplimiento y por vidas perdidas, misiones secundarias y Mapa. **Sin cosméticos ni creación de avatar.** Detalle en `docs/PRODUCT_SPEC.md` §1.1; plan por días en `docs/DEVELOPMENT_ROADMAP.md`.
- **Entrega 1 sin backend (P-57, 2026-11-26):** la app funciona sola en el teléfono (registro e inicio de sesión locales en SQLite, sin respaldo). La Fase 2 se hace después de la entrega, con la IP, el puerto, el usuario y la contraseña del servidor que dará el profesor.
- **No empieces ninguna fase sin aprobación explícita del equipo.** El equipo puede aprobar varias fases en bloque (P-53): ejecútalas en orden y detente al final del bloque.
- **Hechas:** Fases 1, 3 a 7 (2026-11-27), 8 y 9 (2026-11-28) y 10 solo con recompensas reales (2026-11-28). Todas probadas en el teléfono. Detalle por fase en `docs/DEVELOPMENT_ROADMAP.md`; estructura real en `docs/ARCHITECTURE.md` §4.
- **Siguiente:** extras del lunes 30 (ánimo + mini desafío, Superdesafío, pulido, APK) y revisar el cierre automático → **`docs/NEXT_STEPS.md`**.
- **Si el equipo pregunta qué hacer, qué probar o qué sigue:** responde **solo** con lo de `docs/NEXT_STEPS.md`, en pocas líneas, sin leer otros archivos (ahorra tokens). **Al terminar cada fase, reescribe `docs/NEXT_STEPS.md`.**
- **Claves técnicas ya decididas:** servicios con dependencias inyectadas (`services/deps.ts`, reloj controlable en las pruebas); todo `Stack.Protected` lleva `redirectTo` concreto (expo-router 58); ocurrencias con horizonte de 0 días (R-26); Hojas/XP/HP vía `services/ledgerEffects.ts`; reconciliación en `services/reconciliationService.ts` (cierra jornadas pendientes, en cola); cierre de jornada en `services/dayCloseService.ts`.
- **Git:** Claude puede hacer commit, push a ramas y PR con `gh` cuando se lo pidan (`.claude/settings.local.json`; prohibidos `--force` y push a `main`). Ver `docs/GIT_WORKFLOW.md` §8.

## 3. Documentación y orden de consulta

| Documento | Contenido |
|---|---|
| `docs/DECISIONS.md` | Decisiones confirmadas (C), recomendaciones (R), decisiones del equipo (P: resueltas, abiertas, aplazadas) y contradicciones (CT). |
| `docs/BUSINESS_RULES.md` | **Fuente única de verdad** de las reglas (`RN-…`), invariantes (`INT-…`), escenarios de prueba (`ESC-…`) y máquinas de estado. |
| `docs/PRODUCT_SPEC.md` | Especificación funcional y **alcance de la Entrega 1**. |
| `docs/ARCHITECTURE.md` | Stack, carpetas, API, respaldo, tiempo y reconciliación, entorno. |
| `docs/DATA_MODEL.md` | Modelo de datos (**propuesta**, se aprueba en la Fase 1). |
| `docs/DEVELOPMENT_ROADMAP.md` | Fases, plan día a día de la Entrega 1, backlog. |
| `docs/NEXT_STEPS.md` | **Pruebas pendientes y siguiente paso** (respuesta corta a "¿qué hago ahora?"). |
| `docs/GIT_WORKFLOW.md` | Cómo usar Git y GitHub en el equipo. |
| `Documento_Explicativo_The_Life_Game.md` | Documento funcional **original**. **No se modifica.** |
| `.claude/rules/frontend.md` · `backend.md` | Reglas técnicas por carpeta; se cargan al trabajar en ella. |
| `.claude/rules/business-logic.md` | Cómo implementar y probar las reglas del juego. |
| `app/AGENTS.md` | Guía de Expo. Se aplica completa desde la Fase 3 (Expo Router + TypeScript ya decididos). |

### Antes de implementar

1. Comprueba en `DEVELOPMENT_ROADMAP.md` la fase aprobada y sus decisiones bloqueantes.
2. Revisa en `DECISIONS.md` el estado de toda decisión implicada. Si está **Abierta**, **pregunta**.
3. Lee las reglas `RN-…` aplicables y la sección correspondiente de `PRODUCT_SPEC.md`.
4. Consulta `ARCHITECTURE.md` y `DATA_MODEL.md`.
5. Ante una duda sobre la intención original, consulta el documento original.

### Precedencia si hay conflicto

1. Instrucciones explícitas del equipo en la tarea actual.
2. Decisiones confirmadas o resueltas en `DECISIONS.md`.
3. `BUSINESS_RULES.md` y `PRODUCT_SPEC.md`.
4. Documento original, en lo que no se haya actualizado.
5. Las recomendaciones solo cuentan si su estado es Aprobada o Adoptada.

Si encuentras una contradicción nueva: descríbela, indica qué prevalece, regístrala (`DECISIONS.md` §4) y no borres información en silencio.

## 4. Tecnologías

| Área | Tecnología |
|---|---|
| App | Expo SDK **58** (`expo ~58.0.26`), React Native **0.88.1**, React **19.3.0**. **TypeScript**, **Expo Router**, **Zustand**, `expo-sqlite`, `expo-secure-store` (estas se instalan en la Fase 3 con `npx expo install`). Solo **Android**, probada con **Expo Go**. |
| Backend | Node.js **24.19.0**, npm **11.13.0**, **Express 5.3**, `mysql2` 3.x, `cors`, `dotenv`, `nodemon`. **JavaScript CommonJS** (TypeScript después de la entrega, P-52). bcryptjs + token de sesión opaco. |
| Base de datos | MySQL en **XAMPP / phpMyAdmin** (servidor del profesor). SQL portable por una posible migración a Supabase (R-30, P-51). |
| Pruebas | Jest: `jest-expo` (app) · Jest + supertest (backend). |
| Repositorio | Monorepo **público** `https://github.com/JLowZ/The-Life-Game`. |
| Entorno | Windows 11 + VS Code. Ruta local: `C:\Users\USUARIO\Desktop\Estudio\TheLifeGame` (sin espacios ni `&`; se movió el 2026-11-26 porque el `&` rompía `npx`). |

## 5. Estructura del repositorio

```text
The-Life-Game/
├── CLAUDE.md
├── Documento_Explicativo_The_Life_Game.md   (original, no modificar)
├── docs/                                    (harness funcional y técnico + guía de Git)
├── .claude/rules/                           (reglas técnicas)
├── app/                                     (Expo; src/app = rutas de Expo Router desde la Fase 3)
│   └── src/  app/ screens/ components/ state/ services/ domain/ database/ api/ content/ config/ utils/
└── backend/                                 (Express)
    ├── database/migrations/
    └── src/  config/ routes/ middleware/ controllers/ services/ repositories/ validators/ utils/
```

Las carpetas nuevas se crean solo en la fase que las necesita (`ARCHITECTURE.md` §4.1 y §5.1).

## 6. Responsabilidades

| App (`app/`) | Backend (`backend/`) |
|---|---|
| Interfaz pixel art, navegación, HUD, formularios | API REST `/api/v1` |
| **Todas las reglas del juego** (dominio en TypeScript) | Registro, inicio de sesión (usuario o correo), sesiones |
| SQLite como fuente de verdad local; Zustand | Respaldo por instantánea (Entrega 1) |
| Reconciliación de jornadas y vencimientos | Validación de entrada y seguridad |
| Respaldo y restauración | Revalidación de las operaciones críticas (Fase 11) |

## 7. Arquitectura general

- **Local primero:** acción → validación de dominio → transacción SQLite → actualización de Zustand → HUD. Respaldo en el servidor tras cada cierre de jornada y antes de cerrar sesión.
- **Capas de la app:** `rutas → screens/components → state → services → domain` (`services` usa `database` y `api`).
- **Capas del backend:** `routes → middleware → controllers → services → repositories → MySQL`.
- **Tiempo:**
  - la jornada termina a las **04:00**;
  - los desafíos duran **72 h**, con **12 h de gracia** si vencieron con la app cerrada;
  - la reconciliación es idempotente al abrir la app.
- **Un dispositivo por cuenta** en la v1.

## 8. Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes y pantallas | `PascalCase.tsx` | `HeartsBar.tsx`, `HomeScreen.tsx` |
| Rutas de Expo Router | según Expo Router, en minúsculas | `src/app/(tabs)/map.tsx` |
| Hooks | `useCamelCase.ts` | `usePlayerStore.ts` |
| Dominio, servicios, utilidades | `camelCase.ts` (backend: `.js`) | `gameDay.ts`, `authService.js` |
| Tipos e interfaces | `PascalCase` | `HabitOccurrence`, `MoodValue` |
| Variables y funciones | `camelCase` | `hpHalfUnits`, `closeGameDay()` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_HP_HALF_UNITS = 20` |
| Valores de enumeración | `UPPER_SNAKE_CASE` (tipos unión en TypeScript) | `'MISSED'`, `'VERY_BAD'` |
| Tablas y columnas SQL | `snake_case` (tablas en plural) | `habit_occurrences.game_date` |
| Rutas de la API | plural en `kebab-case` | `/api/v1/auth/login` |
| JSON | `camelCase` | `{ "gameDate": "2026-11-13" }` |
| Pruebas | `<módulo>.test.ts` (`.js` en el backend) | `gameDay.test.ts` |
| Ramas y commits | ver `docs/GIT_WORKFLOW.md` | `feature/fase-6-habitos`, `feat(app): …` |

**Idioma:** identificadores en **inglés**; interfaz, documentación y mensajes al usuario en **español**.

**Glosario de identificadores**

| Término | Identificador |
|---|---|
| Hojas de mate | `mateLeaves` / `mate_leaves` |
| HP (unidades de media vida, 0..20) | `hpHalfUnits` / `hp_half_units` |
| XP / Nivel | `xpTotal` / `level` |
| Racha | `perfectStreak` |
| Fecha de jornada | `gameDate` (`game_date`) |
| Ocurrencia | `HabitOccurrence` (`PENDING`, `COMPLETED`, `MISSED`, `CANCELLED`, `PAUSED`) |
| Cantidad + unidad | `targetQuantity`, `unit` |
| Categoría | `HabitCategory` (`EXERCISE`, `STUDY`, `READING`, `ART`, `MINDFULNESS`, …) |
| Estado de ánimo | `MoodEntry` (`VERY_HAPPY`, `GOOD`, `NEUTRAL`, `DOWN`, `VERY_BAD`) |
| Desafío por incumplimiento / mini | `Challenge` con `kind: 'MISSED_HABIT'` y `variant: 'NORMAL' \| 'MINI'` |
| Recuperación / Superdesafío | `kind: 'RECOVERY'` / `kind: 'SUPER'` (+ `SuperChallengeTask`) |
| Misión secundaria | `UserMission` |
| Recompensa real / Cosmético | `Reward` con `type: 'REAL_LIFE' \| 'COSMETIC'`; `cosmeticSlot: 'HEAD' \| 'FACE' \| 'NECK' \| 'CHEST' \| 'HANDS' \| 'LEGS' \| 'FEET'` |
| Clasificación | `PERFECT`, `VERY_GOOD`, `PARTIAL`, `CRITICAL`, `NO_ACTIVITY` |
| Día Finalizado | `closeGameDay({ source: 'MANUAL' })` |

## 9. Reglas de programación

1. **La lógica de negocio va separada de la interfaz:** las reglas van en `app/src/domain/` como funciones puras de TypeScript.
2. **Código modular y mantenible**, con tipos explícitos en el dominio.
3. **Sin números mágicos:** 30, 50, 20, 04:00, 72 h, 12 h, 10 s, 20/20 y los umbrales salen de la configuración.
4. **Las operaciones críticas son transaccionales e idempotentes.**
5. **Tiempo:** usa las funciones de dominio con `now` inyectado. Nunca `new Date()` directamente en la lógica de juego.
6. **Seguridad:** sin contraseñas en texto plano, token solo en SecureStore, SQL parametrizado, secretos solo en `.env`. **El repositorio es público:** nunca subas secretos ni datos reales.
7. **Dependencias:** solo las necesarias y aprobadas. En `app/`, siempre con `npx expo install`. No actualices versiones sin una incompatibilidad demostrada.
8. **No reemplaces** el proyecto Expo ni reinicialices el backend. No reestructures sin aprobación.
9. **Sin IA generativa** como requisito de funcionamiento.
10. **Contenido de terceros** (arte, fuentes, mensajes): solo propio, CC0 u OFL o con licencia que permita uso comercial.
11. **Git:** no hagas commit ni push si no te lo piden. Cuando te lo pidan, trabaja en una rama según `docs/GIT_WORKFLOW.md`.

## 10. Política de pruebas

- Pruebas unitarias **obligatorias** para cada regla crítica, citando `RN-…` o `INT-…`.
- **Idempotencia:** toda operación crítica se ejecuta **dos veces** en la prueba y se comprueba un único efecto.
- **Límites:**
  - HP: 0 y 20 unidades;
  - Hojas: 0, 5, 12 (inválido), 30 y 35 (inválido);
  - XP: 50 y 51;
  - jornada: 03:59 y 04:00;
  - desafíos: 72 h y gracia de 12 h;
  - deshacer: 10 s;
  - umbrales: 100, 85, 40 y 84,6 %.
- Los escenarios `ESC-xx` de cada fase.
- Backend con una base de datos de **pruebas**.
- App: `npx tsc --noEmit` y `npx expo lint` sin errores.
- Una tarea no está terminada si sus pruebas fallan. **Informa de los fallos con su salida real.**

## 11. Reglas de integridad (no negociables)

INT-01 a INT-20 de `BUSINESS_RULES.md` §17. En resumen:

- sin dobles recompensas ni dobles pérdidas;
- HP siempre entre 0 y 20 unidades;
- límites de los hábitos (Hojas en múltiplos de 5, hasta 30; XP ≤ 50);
- sin gastos sin saldo;
- un desafío por ocurrencia y un Superdesafío activo;
- no se completan desafíos vencidos;
- el historial es inmutable;
- cada jornada se procesa una vez;
- requisitos de los cosméticos; equipar es gratis;
- el normal y el mini nunca penalizan dos veces;
- recuperación ≠ prevención;
- consistencia entre local y respaldo;
- bloqueos a 0 HP;
- la gracia se aplica una sola vez;
- deshacer Día Finalizado restaura exactamente la jornada;
- como máximo 3 misiones secundarias por jornada.

## 12. Metodología de trabajo

1. Inspecciona antes de modificar.
2. Explica las decisiones técnicas importantes y las alternativas descartadas.
3. No borres archivos sin autorización.
4. No reemplaces configuraciones sin justificarlo.
5. No instales dependencias innecesarias.
6. No actualices versiones sin verificar la compatibilidad.
7. Una fase a la vez (o un bloque aprobado); al terminar, detente.
8. No inventes reglas funcionales: si algo depende de una decisión **Abierta**, pregunta.
9. No mezcles la lógica de negocio con la interfaz.
10. Escribe código modular y mantenible.
11. Incluye pruebas de las reglas críticas.
12. Actualiza la documentación cuando cambie una decisión aprobada.
13. Pide autorización antes de operaciones destructivas: `DROP`, `TRUNCATE`, borrar `.git` o datos, `push --force`.
14. Al terminar, resume los archivos modificados y por qué, y las pruebas ejecutadas con su resultado.
15. Ten presente el **plazo de la Entrega 1**: prioriza lo imprescindible y aplica los recortes del roadmap si hace falta, **avisando** al equipo.

## 13. Procedimiento para modificar reglas de negocio

1. **Aprobación** explícita del equipo TechPhic.
2. **Registro** en `docs/DECISIONS.md` (entrada, estado, fecha, fuente y documentos afectados; un `CT-xx` si contradice el original).
3. **Regla** actualizada en `docs/BUSINESS_RULES.md` (texto, estado, `ESC-xx` e historial).
4. **Documentos derivados:** `PRODUCT_SPEC.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `DEVELOPMENT_ROADMAP.md`, `.claude/rules/business-logic.md`.
5. **Coherencia:** busca el código de la regla en `docs/` y `.claude/`.
6. **Pruebas primero**; después, el código.
7. El documento original **no se edita**.

## 14. Comandos útiles

| Acción | Comando | Desde |
|---|---|---|
| Iniciar la app (Expo Go, Android) | `npx expo start` | `app/` |
| Instalar una dependencia (con aprobación) | `npx expo install <paquete>` | `app/` |
| Comprobar tipos / lint (desde la Fase 3) | `npx tsc --noEmit` · `npx expo lint` | `app/` |
| Diagnosticar dependencias | `npx expo-doctor` | `app/` |
| Iniciar el backend (desde la Fase 2) | `npm run dev` | `backend/` |
| Pruebas (desde las Fases 2 y 3) | `npm test` / `npx jest` | `app/`, `backend/` |

Inicia Claude Code desde la **raíz** del repositorio para que se carguen este archivo y `.claude/rules/`.
