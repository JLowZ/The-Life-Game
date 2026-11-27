# Roadmap de desarrollo — The Life Game

> Equipo TechPhic · v1.2 (2026-11-25, segunda revisión de la Fase 0)

## Reglas de ejecución

1. **Una fase a la vez.** Claude no programa varias fases en paralelo.
2. Al terminar una fase: resumen de los cambios, resultado de las pruebas y **parada para revisión**. Si el equipo aprueba un **bloque** de fases (P-53), Claude las ejecuta en orden y se detiene al final del bloque.
3. Antes de empezar una fase se revisan sus decisiones bloqueantes. Si alguna está **Abierta**, se pregunta al equipo.
4. Cada fase actualiza la documentación afectada y esta tabla.
5. Todo el trabajo se integra por **Pull Request** (ver `GIT_WORKFLOW.md`).

## Estado

| Fase | Nombre | Entrega 1 | Estado |
|---|---|---|---|
| 0 | Análisis y harness | ✔ | **Revisada dos veces (2026-11-25). Solo falta subir el repositorio a GitHub.** |
| 1 | Arquitectura y modelo de datos | ✔ | **Aprobada (2026-11-26)** |
| 2 | Backend y conexión MySQL | **✘ Después de la entrega (P-57)** | Aplazada: se hace cuando la app funcione en local |
| 3 | Persistencia local y configuración de Expo | ✔ | **Hecha (2026-11-26).** Probada en Expo Go (Android) |
| 4 | Registro, autenticación y perfil | ✔ | **Hecha y probada en Expo Go (2026-11-27).** Añadidos: registro como asistente (R-34) y Ajustes (P-61) |
| 5 | Home y HUD | ✔ | **Hecha y probada (2026-11-27)** sin los extras (mensaje de apertura y selector de ánimo). Engranaje en las cuatro pestañas |
| 6 | Hábitos y programación | ✔ | **Hecha (2026-11-27).** Incluye la acreditación de Hojas y XP de los hábitos (adelantada de la Fase 8). Probada en Expo Go (2026-11-27). R-35 aprobada |
| 7 | Estado de ánimo, desafíos y mini desafíos | ✔ | No iniciada |
| 8 | HP, XP, Hojas de mate y progresión | ✔ | No iniciada |
| 9 | Mapa y cierre diario | ✔ | No iniciada |
| 10 | Tienda y avatar (las misiones pasan a la Fase 7) | Opcional (recompensas reales); sin cosméticos | No iniciada |
| 11 | Sincronización, pruebas y seguridad | Parcial (respaldo y pruebas críticas) | No iniciada |
| 12 | Compilación y distribución | APK opcional | No iniciada |

```text
Entrega 1:  F0 → F1 → F3 → F4 → F5 → F6 → F7 → F8 → F9 (→ F10 si da tiempo)
Después:    F2 (backend con los datos del servidor del profesor) → F11 → F12
```

> **P-57 (2026-11-26):** el profesor indicó que la Entrega 1 **no lleva backend**. La Fase 2 sale de la entrega y la Fase 4 hace el registro y el inicio de sesión **locales**. El resto del orden se mantiene (P-46).

---

## Plan de la Entrega 1 (lunes 30-nov-2026)

> ⚠️ **El plazo es muy ajustado**: 5 días para el núcleo de 10 fases. Exige alcance mínimo en cada fase, aprobaciones rápidas por bloques (P-53) y resolver hoy las decisiones abiertas que bloquean.

**Objetivo (C-20):** la base de la app. Debe poder iniciar sesión, crear hábitos y asignarlos a días, mostrar misiones secundarias, dar recompensas por los hábitos y generar desafíos por las vidas perdidas. **Sin cosméticos ni creación de avatar.**

| Día | Bloque | Resultado verificable |
|---|---|---|
| **Mié 25** | Cierre de la Fase 0 + GitHub | Repositorio en GitHub |
| **Jue 26** | **Fases 1 y 3** (sin Fase 2, P-57) | Modelo ER y DDL SQLite aprobados. App en TypeScript con Expo Router, SQLite (migración `001`), Zustand, configuración de juego y Jest en Expo Go |
| **Vie 27** | **Fases 4 y 5** | Registro e inicio de sesión **locales**, onboarding mínimo (propósito y metas), avatar fijo, Home con **HUD** |
| **Sáb 28** | **Fases 6 y 7** | Crear hábitos y **asignarlos a días**; marcarlos con deshacer; **desafíos por incumplimiento** (72 h), **desafíos de recuperación** por cada vida perdida y **misiones secundarias** (pantalla Desafíos) |
| **Dom 29** | **Fases 8 y 9** | **Recompensas** (Hojas, XP, niveles) y HP conectados; **Mapa** con programación e historial; cierre a las 04:00, Día Finalizado con deshacer y reconciliación |
| **Lun 30** (mañana) | **Pruebas + extras** | Prueba completa en Android. Extras si da tiempo, en este orden: Tienda de recompensas reales → ánimo + mini desafío + mensajes → Superdesafío y bloqueos a 0 HP → pulido pixel art → APK |

> Las **misiones secundarias** se implementan en la **Fase 7**, junto a la pantalla Desafíos donde viven, y no en la Fase 10. No cambia el orden de las fases (P-46): solo dónde cae esa funcionalidad.

**No se recorta nunca:** lo imprescindible de C-20 ni las reglas de integridad (INT-xx) y sus pruebas. Aunque no haya Superdesafío, **el HP nunca baja de 0**, y a 0 HP se puede recuperar con los desafíos de recuperación.

---

## Fase 0 — Análisis y harness ✔

- **Entregables:** `CLAUDE.md`, `docs/*`, `.claude/rules/*`, `docs/GIT_WORKFLOW.md`.
- **Pendiente para cerrarla:** la primera subida del monorepo a GitHub (P-25).

## Fase 1 — Arquitectura y modelo de datos

- **Objetivo:** aprobar el modelo y el contrato de la API de la Entrega 1.
- **Entregables:**
  - `DATA_MODEL.md` v1.3 aprobado, con el diagrama entidad-relación;
  - esquema SQLite v1 (`docs/schema/sqlite_v1.sql`), **para revisión**;
  - recomendaciones R aprobadas (P-55).
  - **Pasan a la Fase 2 (P-57):** DDL de MySQL, contrato de la API y formato de la instantánea de respaldo.
- **Dependencias:** Fase 0. P-36 queda abierta, pero no bloquea.
- **Aceptación:** el equipo aprueba el modelo y el contrato; cada invariante INT-xx tiene asignado su mecanismo.
- **Pruebas:** recorrido de los escenarios ESC-xx contra el modelo.

## Fase 2 — Backend y conexión MySQL

- **Entregables:**
  - `src/app.js` y `src/server.js`;
  - scripts `dev` y `start`; `main` corregido;
  - `.env.example`;
  - pool de `mysql2`;
  - middleware de errores y 404;
  - `/health`;
  - migraciones 001–003 aplicadas (tras aprobación);
  - endpoints de autenticación y respaldo (bcryptjs, token opaco);
  - Jest + supertest.
- **Dependencias:** Fase 1; P-36.
- **Aceptación:**
  - `npm run dev` funciona y se llega a la API desde el teléfono por la LAN;
  - registro, inicio de sesión con usuario **o** correo, cierre de sesión y respaldo funcionan;
  - no hay secretos en el repositorio.
- **Pruebas:**
  - registro válido y duplicado (usuario sin distinguir mayúsculas, correo);
  - inicio de sesión correcto e incorrecto;
  - token revocado o expirado;
  - respaldo de ida y vuelta.

## Fase 3 — Persistencia local y configuración de Expo

- **Entregables:**
  - migración a **TypeScript** + **Expo Router** (entrada `expo-router/entry`; `src/app/(auth)` y `src/app/(tabs)`);
  - `app.json` con la identidad (P-44);
  - `expo-sqlite` con migraciones locales y repositorios;
  - `expo-secure-store`;
  - **Zustand**;
  - ~~cliente de API (`EXPO_PUBLIC_API_URL`)~~ → pasa a la Fase 2 (P-57);
  - constantes de juego (R-21);
  - `jest-expo`.
  - Todas las dependencias con `npx expo install`.
- **Dependencias:** Fase 1.
- **Aceptación:**
  - arranca en Expo Go (Android);
  - las cuatro pestañas navegan;
  - la base de datos se crea y migra de forma idempotente;
  - `npx tsc --noEmit` y `npx expo lint` sin errores.
- **Pruebas:** repositorios; migración local; una prueba de dominio de ejemplo en verde.

## Fase 4 — Registro, autenticación y perfil

- **Entregables:**
  - bienvenida → registro (con el aviso de privacidad) o inicio de sesión;
  - propósito → metas (texto + categoría) → perfil inicial (20 unidades de HP, 0 Hojas, 0 XP, nivel 0) → Home, con un **avatar fijo** (la creación del avatar llega después de la entrega);
  - restauración de la sesión;
  - cierre de sesión (sin borrar datos);
  - enlace "¿Olvidaste tu contraseña?" al correo de soporte.
  - **Entrega 1 (P-57):** todo local. Contraseña con SHA-256 + sal (`expo-crypto`) en `users`; `activeUserId` en SecureStore. El respaldo previo al cierre de sesión y la restauración en otro dispositivo llegan con el backend.
- **Dependencias:** Fase 3. P-40 (correo de soporte; mientras tanto, texto "próximamente").
- **Aceptación:** RN-AUTH-01 a RN-AUTH-09.
- **Pruebas:** validaciones; flujo completo en el dispositivo; cerrar sesión e iniciarla de nuevo conserva el progreso.

## Fase 5 — Home y HUD

- **Entregables:**
  - HUD (avatar, nombre, nivel, barra de XP, diez corazones, racha, Hojas);
  - estructura de Home con las misiones del día;
  - **si da tiempo:** mensaje de apertura y selector de ánimo, con `messages.json` (C-33: al menos 10 mensajes por categoría, generales y empáticos).
- **Dependencias:** Fase 4.
- **Aceptación:**
  - los corazones representan bien las 21 posibilidades (0 a 20 unidades);
  - el HUD se actualiza al instante;
  - los componentes son accesibles.
- **Pruebas:** unidades → corazones; nivel y progreso de la barra de XP; selección de mensaje.

## Fase 6 — Hábitos y programación

- **Entregables:**
  - crear, editar y eliminar hábitos (nombre, categoría, cantidad y unidad, Hojas en múltiplos de 5, XP según P-54);
  - programación semanal o por fechas;
  - generación de ocurrencias (R-26);
  - `gameDate` con corte a las 04:00;
  - marcar cumplido o incumplido con **deshacer en 10 s**;
  - copias de los valores (R-13);
  - regla de editar o eliminar (hoy conserva, las futuras se regeneran).
- **Dependencias:** Fase 5.
- **Aceptación:**
  - RN-HAB-01 a RN-HAB-09 y RN-DAY-01 a RN-DAY-08;
  - los escenarios ESC-01 a ESC-04, ESC-18 y ESC-24 pasan.
- **Pruebas:** 03:59 y 04:00; límites (12, 30, 35 Hojas y 50, 51 XP); deshacer a los 5 s y a los 15 s; idempotencia al completar.

## Fase 7 — Estado de ánimo, desafíos y mini desafíos

- **Entregables de la Entrega 1:**
  - desafío por incumplimiento (tamaño del 50 %, plazo de 72 h, autodeclaración, cuenta atrás);
  - **desafío de recuperación por cada vida perdida** (sin plazo);
  - **misiones secundarias** (modal con felicitación, categoría, sugerencia editable, 20/20, máximo 3 al día);
  - pantalla Desafíos.
  - Efectos de Hojas, XP y HP definidos como resultados del dominio (se conectan en la Fase 8).
  - El dominio ya admite la variante `MINI`: si no hay estado de ánimo, siempre es `NORMAL`.
- **Si da tiempo:**
  - ánimo + mini desafío (rechazar, pasar al normal, deshacer el rechazo) y mensaje al invocarlo;
  - gracia de 12 h;
  - Superdesafío (una tarea por hábito activo, sin plazo).
- **Dependencias:** Fase 6.
- **Aceptación:**
  - RN-DES-xx y RN-MIS-xx (RN-MOOD-xx si entra el ánimo);
  - los escenarios ESC-08 a ESC-11, ESC-19, ESC-20, ESC-25, ESC-26 y ESC-28 pasan (los de ánimo, si entra).
- **Pruebas:** cinco estados de ánimo más el caso sin registro; cambio de ánimo; límites de 72 h; gracia aplicada una sola vez; un desafío por ocurrencia.

## Fase 8 — HP, XP, Hojas de mate y progresión

- **Entregables:**
  - libros de movimientos con claves de idempotencia;
  - acreditación de hábitos;
  - recompensa de los desafíos (½ Hojas hacia abajo + 20 % XP);
  - misiones secundarias (20/20);
  - pérdida al vencer (−1 unidad) y recuperación (+1 unidad);
  - tabla de niveles;
  - jornadas en pausa.
  - **Si da tiempo:** Superdesafío (HP = 20), cancelación del Superdesafío al recuperar a 0 HP y bloqueos a 0 HP.
- **Dependencias:** Fase 7.
- **Aceptación:**
  - RN-ECO-xx, RN-XP-xx y RN-HP-xx;
  - los escenarios ESC-05 a ESC-07, ESC-30 y ESC-31 pasan (ESC-21 a ESC-23 si entran los extras);
  - los saldos coinciden con la suma de los libros.
- **Pruebas:** límites 0 y 20; idempotencia de cada efecto; subida de nivel; acciones bloqueadas a 0 HP.

## Fase 9 — Mapa y cierre diario

- **Entregables:**
  - mover "Mis hábitos" (crear, editar y programar) de Inicio al Mapa (RN-HAB-03; decisión del equipo del 2026-11-27);
  - calendario con clasificación (color + icono);
  - detalle del día con su último ánimo y su mensaje;
  - tabla de programación;
  - Día Finalizado con su mensaje y **deshacer hasta las 04:00**;
  - `closeGameDay` con los pasos de RN-CLOSE-02;
  - reconciliación;
  - racha (los días sin actividades se saltan);
  - **respaldo tras el cierre**.
- **Dependencias:** Fase 8.
- **Aceptación:**
  - RN-MAP-xx y RN-CLOSE-xx;
  - los escenarios ESC-12 a ESC-15 y ESC-27 pasan.
- **Pruebas:** clasificación (100, 85, 40, 84,6 %); cierre manual seguido de automático; cinco jornadas sin abrir la app.

## Fase 10 — Tienda y avatar

- **Entrega 1 (solo si da tiempo):** recompensas reales personalizadas (costo ≥ 20) con canje ilimitado. Escenarios ESC-17 y ESC-29.
- **Después de la entrega:**
  - cosméticos (Gorra, Cadena, Gafas, Hoodie; P-16) con nivel mínimo, compra y equipar (uno por ranura) (ESC-16);
  - creación y personalización del avatar con el estilo del logo (P-38).
- **Dependencias:** Fase 8.
- **Pruebas:** saldo insuficiente; costo < 20; canje repetido; más tarde, nivel insuficiente y equipar sin coste.

## Fase 11 — Sincronización, pruebas y seguridad (después de la entrega)

- Cola de salida y sincronización por operaciones.
- Revalidación de las operaciones críticas en el servidor.
- Tablas del juego en MySQL.
- Revisión de seguridad.
- Cobertura de todas las INT-xx.
- **En la Entrega 1** solo se incluyen el respaldo por instantánea y las pruebas críticas.

## Fase 12 — Compilación y distribución

- APK de prueba con EAS (opcional en la Entrega 1; ver la nota sobre HTTP sin cifrar en `ARCHITECTURE.md` §4.7).
- Más adelante: hosting con HTTPS (P-36, P-51), recursos definitivos y publicación en Google Play.

---

## Backlog posterior a la Entrega 1

| Elemento | Referencia |
|---|---|
| Recordatorios de 18:00 a 20:00 | P-47 |
| Hábitos recomendados y recompensas predefinidas | P-04, P-05 |
| Sincronización por operaciones y revalidación en el servidor | Fase 11, CT-21 |
| Backend en TypeScript | P-52 |
| Migración a Supabase | P-51 |
| Varias ocurrencias de un hábito por día | P-43 |
| Más cosméticos y arte pixel art definitivo | C-22 |
| Mensajes personalizados con IA (opcional) | C-15 |
| Integración continua con GitHub Actions | `GIT_WORKFLOW.md` |

## Matriz de decisiones abiertas por fase

| Fase | Decisiones abiertas que le afectan |
|---|---|
| 1–2 | P-36 (dónde corre Node). **No bloquea:** se desarrolla en local con XAMPP. |
| 4 | P-40 (correo de soporte). **No bloquea:** texto "próximamente". |
| 10 (después de la entrega) | P-38 (arte del avatar a partir del logo). |
| — | P-56 (normas de la universidad sobre la licencia). |

Todas las demás decisiones de las Fases 1 a 9 están resueltas.

## Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-25 | Versión inicial (Fase 0). |
| 2026-11-26 | P-57: Entrega 1 sin backend. La Fase 2 pasa a después de la entrega; el jueves se hacen las Fases 1 y 3; autenticación local en la Fase 4. |
| 2026-11-27 | Fase 6: hábitos, programación semanal o por fechas, ocurrencias con horizonte de 0 días, marcado con deshacer en 10 s y acreditación de hábitos con libros de movimientos (adelantada de la Fase 8). |
| 2026-11-27 | Fase 4 probada. Botón atrás en el registro (R-34), Ajustes (P-61), categoría general (P-59). Fase 5: HUD en la cabecera de las pestañas; mensaje de apertura y ánimo pasan a los extras del lunes. |
| 2026-11-27 | Fase 3 probada en Expo Go. Fase 4 hecha: registro, inicio de sesión y onboarding locales, sesión con `Stack.Protected`. |
| 2026-11-25 | v1.2: alcance mínimo de la Entrega 1 (sin cosméticos ni creación de avatar); misiones secundarias en la Fase 7; extras ordenados; matriz de decisiones actualizada. |
| 2026-11-25 | v1.1: plan de la Entrega 1 (30-nov), alcance reducido por fase, recortes priorizados, backlog posterior y nueva matriz de decisiones. |
