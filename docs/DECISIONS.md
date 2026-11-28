# Registro de decisiones — The Life Game

> Equipo TechPhic · Documento vivo · Creado en la Fase 0 (2026-11-25) · Última actualización: 2026-11-25 (segunda ronda de revisión de la Fase 0)

Este documento registra **qué está decidido, qué es una recomendación técnica y qué falta decidir**. Es la referencia obligatoria antes de implementar cualquier regla.

## Cómo leer este documento

| Prefijo | Significado | ¿Se puede implementar? |
|---|---|---|
| `C-xx` | **Confirmado.** Regla aprobada (documento original o decisión del equipo). | Sí. |
| `R-xx` | **Recomendación técnica.** | Solo si su estado es *Aprobada* o *Adoptada*. |
| `P-xx` | **Decisión del equipo:** *Resuelta*, *Abierta* o *Aplazada*. | Solo si está *Resuelta*. Si está *Abierta*, detenerse y preguntar. |
| `CT-xx` | Contradicción o actualización respecto al documento original o a una decisión anterior. | — |

El prefijo nunca cambia; cambia el **estado**. Cada cambio se propaga según `CLAUDE.md` §13.

**Fuentes citadas**

- **Doc §n**: `Documento_Explicativo_The_Life_Game.md`, v1.0.
- **Instr. Fase 0**: instrucciones de la Fase 0.
- **Rev. 1 (Xn)** y **Rev. 2 (Xn)**: primera y segunda ronda de respuestas del equipo (25-nov-2026), por código de pregunta.

---

## 1. Decisiones confirmadas

| Código | Decisión | Fuente | Estado |
|---|---|---|---|
| C-01 | El backend se desarrolla con **Node.js y Express** (Express 5.3). | Instr. Fase 0 (CT-01) | Confirmado |
| C-02 | La base de datos es **MySQL** en **XAMPP / phpMyAdmin** (servidor del profesor). La migración a Supabase se evaluará después (P-51). | Rev. 1 (A10) | Confirmado |
| C-03 | **React Native + Expo** (proyecto existente, SDK 58), probado con **Expo Go**. **Solo Android.** | Rev. 1 (A2, A3) | Confirmado |
| C-04 | La arquitectura es **local primero**: el servidor autentica y respalda. Respaldo por instantánea en la Entrega 1 (R-29). | Doc §3 | Confirmado |
| C-05 | El perfil inicial tiene **10 HP (20 unidades), 0 Hojas, 0 XP y nivel 0**. | Rev. 1 (C1) | Confirmado |
| C-06 | Recompensa de cada hábito (recomendado o personalizado): **Hojas ∈ {0, 5, 10, 15, 20, 25, 30}** y **XP ∈ {0, 10, 20, 30, 40, 50}**, presentada como dificultad. | Rev. 1 (B15, B16), Rev. 2 (6) (CT-18, CT-19) | Confirmado |
| C-07 | Editar o eliminar un hábito no toca el historial. Las ocurrencias futuras se regeneran y la de hoy conserva sus valores. | Rev. 1 (B13) | Confirmado |
| C-08 | **HP = 20 unidades internas** ("vidas internas"), mostradas como **10 corazones**. Un incumplimiento penalizado resta **1 unidad = medio corazón**, al **vencer el plazo** de su desafío. | Doc §7.3; Rev. 2 (1a) (CT-04) | Confirmado |
| C-09 | Cada incumplimiento genera **un** desafío. Si se completa en plazo, no se pierde vida. | Rev. 1 (B9) (CT-08) | Confirmado |
| C-10 | Con el último ánimo **Desanimado o Muy mal**, el desafío es un **mini desafío**. | Instr. Fase 0 (CT-03) | Confirmado |
| C-11 | Con **Muy feliz, Bien, Neutral o sin estado registrado**, el desafío es normal (el tono varía). | Instr. Fase 0; Rev. 1 (B3) | Confirmado |
| C-12 | Tras rechazar un mini desafío, el usuario puede pasarse al normal o deshacer el rechazo mientras esté en plazo. | Rev. 1 (B4) | Confirmado |
| C-13 | La jornada cierra **automáticamente a las 04:00**, manualmente con **Día Finalizado** o por reconciliación. El proceso es idempotente. | Doc §12 | Confirmado |
| C-14 | Clasificación del día **sin redondear** (84,6 % = Parcial). Día sin hábitos: "Sin actividades programadas". | Rev. 1 (B11) | Confirmado |
| C-15 | Mensajes desde un **JSON local**; la IA queda como opción futura, nunca como requisito. | Doc §5.2 | Confirmado |
| C-16 | La sección se llama **Desafíos**; nunca "castigo". | Doc §9 | Confirmado |
| C-17 | Los cosméticos se desbloquean por nivel y se compran con Hojas; equiparlos es gratis. | Doc §11.2 | Confirmado |
| C-18 | HUD: avatar, nombre, nivel, XP, 10 corazones, racha y Hojas. Pestañas: Home, Mapa, Desafíos y Tienda (orden cambiado por P-62; el original ponía Tienda antes que Desafíos). | Doc §5.1, §13 | Confirmado |
| C-19 | Contraseñas nunca en texto plano; token en almacenamiento seguro. | Doc §4.2 | Confirmado |
| C-20 | **Entrega 1 (lunes 30-nov-2026), alcance mínimo.** **Imprescindible:** login, crear hábitos y asignarlos a días, HUD, recompensas por hábitos, desafíos por incumplimiento y por vidas perdidas, misiones secundarias y Mapa. **Sin cosméticos.** Se cuida que se vea bien, pero no es prioritario. Detalle en `PRODUCT_SPEC.md` §1.1. | Rev. 1 (A1), **Rev. 2 (final)** | Confirmado (actualizado) |
| C-21 | Monorepo **público** `https://github.com/JLowZ/The-Life-Game`. Usuario del dueño: `JLowZ`. Colaboradores: `senkoxl` (Dylan) y David cuando cree su cuenta. | Rev. 1, Rev. 2 (16) | Confirmado |
| C-22 | Interfaz en **pixel art**, basada en el **logo** y los bocetos del equipo. El acabado va después de la lógica. | Rev. 1 (C7), Rev. 2 (10) | Confirmado |
| C-23 | Los hábitos son **medibles** (cantidad + unidad) y tienen **categoría**. | Rev. 1 | Confirmado |
| C-24 | Los desafíos muestran su **tiempo restante**. | Rev. 1 | Confirmado |
| C-25 | Hay un **aviso de privacidad** y un consentimiento en el registro. | Rev. 1 | Confirmado |
| C-26 | Las "misiones del día" son los hábitos programados; las **misiones secundarias** son extras voluntarias. | Rev. 1 (B7, C6) | Confirmado |
| C-27 | **Recompensa de los desafíos** (por incumplimiento, normal o mini, y de recuperación): **½ de las Hojas** del hábito (redondeo **hacia abajo**) + **20 % de su XP**. No convierten el hábito en cumplido ni cambian el porcentaje del día. | Rev. 1 (B6, B9); **Rev. 2 (1c, 2)** (CT-13, CT-22) | Confirmado (actualizado) |
| C-28 | El ánimo se puede cambiar sin límite; **prevalece el último**, que es el que guarda el Mapa. | Rev. 1 (B2) | Confirmado |
| C-29 | **Día Finalizado se puede deshacer** mientras no lleguen las 04:00 de ese día. | Rev. 2 (CT-23) | Confirmado |
| C-30 | Una **recompensa real** cuesta **como mínimo 20 Hojas** (evita abusos). Los canjes son ilimitados. | Rev. 2 | Confirmado |
| C-31 | **Misiones secundarias:** como máximo **3 por jornada**, 20 Hojas + 20 XP cada una. El usuario puede **modificar** la misión sugerida o escribir la suya. | Rev. 2 (C6, 4) | Confirmado |
| C-32 | Se elimina `app/LICENSE` (licencia de la plantilla de Expo). El proyecto es **"Todos los derechos reservados"** (archivo `LICENSE` en la raíz). Falta revisar las normas de la universidad. | Rev. 2 (D6, 13) | Confirmado (revisión de la universidad pendiente) |
| C-33 | Mensajes: **al menos 10 por categoría**, más mensajes motivacionales generales y **mensajes empáticos** para el ánimo bajo. Contenido original redactado por Claude. | Rev. 2 | Confirmado |

---

## 2. Recomendaciones técnicas

| Código | Recomendación | Estado |
|---|---|---|
| R-01 | HP como entero de **unidades de media vida** (0..20). | **Aprobada** (P-55; Rev. 2 1a) |
| R-02 | `expo-sqlite` como almacenamiento local principal. | **Aprobada** (P-55) |
| R-03 | kv-store o AsyncStorage solo para preferencias. | **Aprobada** (P-55) |
| R-04 | Token en `expo-secure-store`. | **Aprobada** (P-55) |
| R-05 | UUID generados en el cliente (`expo-crypto`). | **Aprobada** (P-55) |
| R-06 | Libros de movimientos (Hojas, XP, HP) con clave de idempotencia; saldos como caché verificable. | **Aprobada** (P-55) |
| R-07 | Cola de salida + `processed_operations`. | Aplazada (Fase 11) |
| R-08 | `gameDate`: si la hora local es anterior a las 04:00, cuenta el día anterior; marcas en UTC con la zona del teléfono. | **Aprobada** (P-55) |
| R-09 | Reconciliar al abrir la app, al volver al primer plano y al recuperar la conexión. | **Aprobada** (P-55) |
| R-10 | Clasificación con aritmética entera sin redondear. | **Aprobada** |
| R-11 | Dominio de funciones puras en TypeScript con el reloj inyectado. | **Aprobada** (P-55) |
| R-12 | Variante del desafío fija al crearse. | Rechazada (C-28) |
| R-13 | Copia en cada ocurrencia del nombre, las recompensas, la cantidad y la categoría. | **Aprobada** (P-55) |
| R-14 | Eliminación lógica de los hábitos. | **Aprobada** (P-55) |
| R-15 | `UNIQUE(source_occurrence_id)` en los desafíos por incumplimiento. | **Aprobada** (P-55) |
| R-16 | bcryptjs + token opaco revocable (30 días). HTTPS en producción. | **Adoptada** (§2.1) |
| R-17 | SQL parametrizado y transacciones con bloqueo de fila. | **Aprobada** (P-55) |
| R-18 | Backend en capas: routes → middleware → controllers → services → repositories. | **Aprobada** (P-55) |
| R-19 | API `/api/v1`, JSON en camelCase, error uniforme. | **Aprobada** (P-55) |
| R-20 | Catálogos como datos versionados. | **Aprobada** (P-55) |
| R-21 | Constantes de juego centralizadas. | **Aprobada** (P-55) |
| R-22 | Verificar la versión del motor de XAMPP (MariaDB o MySQL). | **Aprobada** (P-55) |
| R-23 | `EXPO_PUBLIC_API_URL` con la IP LAN y sin secretos. | **Aprobada** (P-55) |
| R-24 | `BUSINESS_RULES.md` como fuente única; los `ESC-xx` sirven de pruebas. | **Aprobada** (P-55) |
| R-25 | Las penalizaciones a 0 HP se registran con delta 0. | **Aprobada** (P-55) |
| R-26 | Ocurrencias en un horizonte móvil. **Fase 6:** horizonte de **0 días** (`OCCURRENCE_HORIZON_DAYS`): solo se guarda la fila de la jornada actual y las futuras se calculan desde la programación, así que editar un hábito no reescribe filas (RN-HAB-05). | **Aprobada** (P-55) |
| R-27 | Cola de salida desde la Fase 6. | Aplazada (Fase 11) |
| R-28 | Iniciar Claude Code desde la raíz. | **Aprobada** (P-55) |
| R-29 | Respaldo por instantánea en la Entrega 1 (si da tiempo; ver C-20). | **Adoptada** (§2.1) |
| R-30 | SQL portable a PostgreSQL (Supabase). | **Adoptada** (§2.1) |
| R-31 | **Formato del nombre de usuario:** de 3 a 20 caracteres; solo letras, números, `_`, `.` y `-`; sin espacios ni `@`. Así "usuario o correo" (RN-AUTH-07) nunca es ambiguo: con `@` es un correo. Fase 4. | **Aprobada** (equipo, 2026-11-27) |
| R-32 | **Límites de texto del onboarding:** propósito obligatorio (máx. 200 caracteres), al menos 1 meta (máx. 100 caracteres cada una). Fase 4. | **Aprobada** (equipo, 2026-11-27) |
| R-34 | **Registro como asistente:** el formulario de la cuenta solo valida y comprueba que el usuario y el correo estén libres; la cuenta, el perfil inicial, el propósito y las metas se crean **juntos al final del onboarding**, en una transacción. Permite volver atrás y corregir los datos y evita cuentas a medias. El borrador vive solo en memoria (contiene la contraseña). Las cuentas antiguas sin onboarding siguen pudiendo terminarlo. | **Adoptada** (equipo, 2026-11-27: "poder volver después de crear usuario y contraseña") |
| R-35 | **Límites del formulario de hábitos:** nombre de máx. 60 caracteres, cantidad de 1 a 9.999, unidad libre de máx. 20 caracteres; las fechas concretas se eligen entre las próximas 4 semanas. Fase 6. | **Aprobada** (equipo, 2026-11-27) |
| R-36 | **Misiones secundarias:** descripción de máx. 80 caracteres; la sugerencia usa, por orden, un hábito activo de la categoría (sesión extra de tamaño normal), una meta de la categoría o una sugerencia por defecto de la categoría (`content/challengeTexts.ts`). Fase 7. | **Aprobada** (equipo, 2026-11-28) |
| R-37 | **Detalles del cierre de jornada (Fases 8 y 9):** (1) una jornada queda **"En pausa"** (P-50) si el HP es **0 en el momento del cierre**: sus pendientes pasan a `PAUSED`, sin desafíos; lo ya marcado se conserva. (2) Tras **Día Finalizado** no se marca, no se aceptan ni completan misiones secundarias y un hábito nuevo empieza al día siguiente. (3) Las misiones aceptadas sin completar pasan a `ABANDONED` al **terminar la jornada (04:00, en la reconciliación)**, no al pulsar Día Finalizado: así deshacer el cierre las deja intactas (INT-19). (4) Deshacer Día Finalizado se rechaza si ya se completó un desafío creado por ese cierre. (5) La primera reconciliación tras arrancar la app siempre cuenta como apertura (gracia de 12 h), sin depender de qué pantalla la pida antes. (6) Las jornadas en las que no se abrió la app se cierran con los hábitos y la programación vigentes ese día. | **Aprobada** (equipo, 2026-11-28) |
| R-33 | **Aviso de privacidad** (`app/src/content/authTexts.ts`), redactado en tono formal: responsable, datos, finalidad, ánimo como dato voluntario, almacenamiento local, terceros, derechos, menores y cambios. Describe la Entrega 1 (todo en el teléfono). Se revisa con el backend, el correo de soporte (P-40) y la ley aplicable (P-56); no sustituye una revisión jurídica. | **Aprobada** (equipo, 2026-11-27) |

### 2.1. Decisiones delegadas a Claude (justificación)

| Decisión | Elección | Motivo principal | Descartado |
|---|---|---|---|
| P-21 Navegación | **Expo Router** | Oficial en Expo y exigido por `AGENTS.md`. Cada archivo es una ruta. Las pestañas y el flujo de autenticación son simples. Se apoya en React Navigation. | React Navigation manual: más código repetitivo. |
| P-22 Lenguaje | **TypeScript en la app; JavaScript en el backend** (hasta P-52) | Los tipos protegen las reglas del juego y Expo está pensado para TypeScript. El backend es pequeño y ya está en CommonJS. | Todo JavaScript (sin red de seguridad); todo TypeScript ya (riesgo en el backend con el plazo). |
| P-23 Estado | **Zustand** | El HUD se actualiza a menudo: con selectores solo se redibuja lo necesario, y los servicios pueden actualizar el estado fuera de React. | Context + `useReducer` (redibuja demasiado); Redux Toolkit (demasiado complejo). |
| P-26 Técnica | **bcryptjs + token opaco** | Sin compilación nativa en Windows. La sesión se puede revocar. Simple. | JWT: no se revoca fácilmente. |
| R-29 | **Instantánea** | Cumple "cerrar sesión no pierde el progreso" con un solo dispositivo por cuenta. | Sincronización por operaciones (Fase 11). |
| R-30 | **SQL portable** | Abarata la migración a Supabase. | — |
| P-44 Paquete | `com.techphic.thelifegame` | Convención de dominio invertido. Permanente en Google Play. | — |

---

## 3. Decisiones del equipo

### 3.1. Resueltas

| Código | Tema | Resolución | Fuente |
|---|---|---|---|
| P-01 | Saldos iniciales | 0 Hojas, 0 XP. | Rev. 1 (C1) |
| P-02 | Nivel inicial | 0. | Rev. 1 (C1) |
| P-03 | Curva de niveles | Cada nivel cuesta **80 XP más** que el anterior. Paso al nivel *n* = `80·n + 20`; total para el nivel *n* = `40·n² + 60·n` (nivel 1 = 100, nivel 5 = 1.300, nivel 10 = 4.600, nivel 20 = 17.200). Sin máximo. | Rev. 2 (C2, 6) |
| P-06 | Desafíos normales | Se derivan del hábito medible (P-07). | Rev. 1 (C5) |
| P-07 | Tamaño de los desafíos | Normal = **50 %** de la cantidad; mini = **10 %**. Redondeo hacia arriba, mínimo 1. Los desafíos de recuperación y los retos del Superdesafío usan el tamaño normal. | Rev. 2 (5) |
| P-08 | Finalización | **Autodeclaración** con un criterio medible. | Rev. 1 (C5) |
| P-09 | Plazo | **72 h** desde la creación (manual o automática); **12 h de gracia** si venció con la app cerrada, una sola vez. | Rev. 1 (B1) |
| P-10 | Rechazo del mini | C-12. | Rev. 1 (B4) |
| P-11 | Ánimo que prevalece | El último. La variante de los desafíos **pendientes de la jornada abierta** sigue al último ánimo; al cerrarse la jornada queda fija. | Rev. 1 (B2), Rev. 2 (interpretaciones aceptadas) |
| P-12 | Recuperación | Cada vida perdida (1 unidad) genera **un desafío de recuperación** del mismo hábito (tamaño normal, **sin plazo**). Completarlo devuelve **1 unidad (medio corazón)** + ½ Hojas + 20 % de la XP (C-27). Sin límite diario adicional: hay como mucho uno por vida perdida. **A 0 HP**, completar cualquier desafío devuelve 1 unidad y **cancela el Superdesafío**. | Rev. 1 (B7, B9), Rev. 2 (1a–c) |
| P-13 | Superdesafío | Un reto por hábito activo, sin plazo. Al completarlos todos, HP = 20 unidades. Sus retos no dan Hojas ni XP (*interpretación*). | Rev. 1 (B8) |
| P-14 | Restricciones a 0 HP | Bloqueado: programar, marcar hábitos, Tienda, misiones secundarias. Permitido: avatar, desafíos, Superdesafío, consultar. | Rev. 1 (B7), Rev. 2 |
| P-15 | Misiones secundarias | C-31. Sugerencia según metas y hábitos de la categoría, **editable** por el usuario. | Rev. 2 (4) |
| P-16 | Cosméticos | **Después de la Entrega 1.** Primer catálogo: **Gorra** (cabeza, nivel 1, 30 Hojas), **Cadena** (cuello, nivel 2, 35), **Gafas** (cara, nivel 2, 40), **Hoodie** (pecho, nivel 3, 50). Uno equipado por ranura. | Rev. 2 (8) |
| P-17 | Sincronización | Instantánea (Entrega 1, si da tiempo); operaciones en la Fase 11. | Rev. 1 |
| P-18 | Conflictos | Un dispositivo por cuenta en la v1. | Rev. 1 (A8) |
| P-19 | Zona horaria | La del teléfono; los viajes se ignoran en la v1. | Rev. 1 (A9) |
| P-20 | Plataforma | Solo Android; Expo Go. El APK es opcional. | Rev. 1 |
| P-21 | Navegación | Expo Router (§2.1). | Delegada |
| P-22 | Lenguaje | TypeScript (app) / JavaScript (backend) (§2.1). | Delegada |
| P-23 | Estado | Zustand (§2.1). | Delegada |
| P-24 | Pruebas | Jest: `jest-expo` en la app; Jest + supertest en el backend. | Rev. 1 (A7) |
| P-25 | Repositorio | Monorepo público en `JLowZ/The-Life-Game`. Se retira `app/.git` (copia de seguridad fuera del proyecto). | Rev. 2 (16) |
| P-26 | Autenticación | Login con usuario **o** correo; bcryptjs + token opaco. | Rev. 1 (D1) |
| P-27 | Valores de las recompensas | C-06. | Rev. 1, Rev. 2 |
| P-28 | Editar o eliminar | C-07. | Rev. 1 (B13) |
| P-29 | Deshacer un registro | 10 s (configurable). | Rev. 1 (B5) |
| P-30 | Racha | Jornadas Perfecto consecutivas; las de "sin actividades" y "en pausa" se saltan. | Rev. 1 (B10), Rev. 2 (3) |
| P-31 | Porcentajes no enteros | Sin redondear. | Rev. 1 (B11) |
| P-32 | Mensajes | Contextos: apertura, cierre de jornada, mini desafío, días anteriores. Contenido según C-33. | Rev. 1 (C8), Rev. 2 |
| P-33 | Efectos de los desafíos | C-27. | Rev. 2 (1c) |
| P-34 | Tras Día Finalizado | Mensaje de cierre según el rendimiento y la meta. **Se puede deshacer hasta las 04:00** (C-29). | Rev. 1 (B12), Rev. 2 |
| P-35 | Sin ánimo registrado | Desafío normal. | Rev. 1 (B3) |
| P-37 | Recompensas reales | Ilimitadas; costo **≥ 20 Hojas** (C-30). | Rev. 1 (C9), Rev. 2 |
| P-39 | Cierre de sesión | Nunca borra datos sin respaldar. | Rev. 1 (D4) |
| P-41 | Metas | Texto libre + categoría (las mismas que las de los hábitos). | Rev. 1 (C10) |
| P-42 | Categorías | **17** desde P-59 (se añade *Desarrollo personal general*, la primera). Las 16 originales: Ejercicio · Estudio · Lectura · Arte y creatividad · Mindfulness · Salud y alimentación · Autocuidado · Hogar y orden · Finanzas personales · Relaciones y vida social · Trabajo y productividad · Espiritualidad · Bienestar digital · Ocio y hobbies · Voluntariado y comunidad · Otro. | Rev. 2 (C3, 7) |
| P-44 | Identidad | "The Life Game", slug `the-life-game`, paquete `com.techphic.thelifegame`. Licencia: C-32. | Rev. 1 (D6), Rev. 2 (13) |
| P-45 | Migraciones | SQL numerados (servidor); `PRAGMA user_version` (SQLite). | Rev. 1 (A10) |
| P-46 | Orden de las fases | Se mantiene. | Rev. 1 (A11) |
| P-47 | Recordatorios | 18:00–20:00. Después de la entrega. | Rev. 1 (D5) |
| P-48 | Registro | Usuario único (sin distinguir mayúsculas). Contraseña de **mínimo 6 caracteres**. | Rev. 1 (D2), Rev. 2 (12) |
| P-49 | Redondeo de ½ Hojas | **Hacia abajo** (5 → 2, 15 → 7, 25 → 12). El 20 % de la XP siempre es entero, porque la XP va de 10 en 10. | Rev. 2 (2) |
| P-50 | Jornadas a 0 HP | **"En pausa"**: no cuentan en el porcentaje, no generan desafíos y se saltan en la racha. | Rev. 2 (3) |
| P-53 | Aprobación por bloques | Sí: dos fases por día según el plan. | Rev. 2 (14) |
| P-54 | Valores de XP | 0, 10, 20, 30, 40 o 50, presentados como dificultad. | Rev. 2 (6) |
| P-55 | Recomendaciones | Aprobadas en bloque. | Rev. 2 (15) |
| P-59 | Categoría general | Se añade la categoría **Desarrollo personal general** (`PERSONAL_DEVELOPMENT`), que abarca todas las demás. Va la primera de la lista. Migración local `002` (la `001` no se edita). Necesitará también sus mensajes (C-33) cuando se redacten. | Equipo, 2026-11-27 |
| P-61 | Ajustes | Pantalla **Ajustes**, que se abre con un **engranaje en el HUD de las cuatro pestañas** (el equipo lo amplió desde Inicio el 2026-11-27): cambiar el **nombre de usuario** (R-31, único), editar el **texto y la categoría de las metas**, **volumen de la música** y **Cerrar sesión** (sale de Inicio). | Equipo, 2026-11-27 |
| P-62 | Orden de las pestañas | **Home → Mapa → Desafíos → Tienda** (se intercambian Desafíos y Tienda). Solo cambia el orden de la barra; no afecta a ninguna regla del juego. Modifica C-18 y RN-NAV-01 (CT-26). | Equipo, 2026-11-28 |
| P-58 | Ciclo de vida de las misiones secundarias | (1) Una misión **aceptada y sin completar al cerrar la jornada** pasa a `ABANDONED`, sin pérdida de HP ni de Hojas. (2) El usuario puede **abandonarla a mano**. (3) Las abandonadas **no cuentan** para el máximo de 3 por jornada. (4) Las misiones secundarias **no cuentan** en el porcentaje del Mapa ni en la racha: el porcentaje es solo de las misiones del día (hábitos programados). | Equipo, 2026-11-26 |
| P-57 | Entrega 1 sin backend | **La Entrega 1 no lleva backend** (indicación del profesor). La app funciona sola en el teléfono: registro e inicio de sesión **locales** en SQLite (hash SHA-256 con sal, `expo-crypto`), sesión = `activeUserId` en SecureStore, sin respaldo. El backend (Fase 2) se hace **después** de tener la app funcional, con la IP, el puerto, el usuario y la contraseña que dará el profesor. Afecta a C-04, R-29, RN-AUTH-05, RN-AUTH-08 y RN-CLOSE-08 solo durante la Entrega 1 (CT-25). | Equipo, 2026-11-26 (profesor) |

### 3.2. Abiertas

#### P-36 · Dónde se ejecuta el backend Node.js — **URGENTE**
- XAMPP ofrece MySQL y phpMyAdmin, pero **no ejecuta Node.js**.
- El equipo consulta al profesor con el mensaje redactado en la revisión.
- Mientras tanto, se desarrolla con el backend y XAMPP **en el portátil del equipo**. Ese entorno no cambia, sea cual sea la respuesta.
- **Bloquea:** la configuración final de la conexión (Fase 2), no el desarrollo.
- **2026-11-26:** ya no afecta a la Entrega 1 (P-57). El profesor dará la IP, el puerto, el usuario y la contraseña del servidor cuando se haga el backend.

#### P-38 · Recursos gráficos pixel art
- El equipo comparte el **logo** y sus **bocetos**. Claude propone, a partir de ellos, la paleta, la tipografía y sprites sencillos generados a partir de una cuadrícula de píxeles.
- En la Entrega 1 el avatar es un **marcador fijo** (no hay creación de avatar).
- **Bloquea:** el acabado visual (no la funcionalidad).

#### P-40 · Correo de soporte — **URGENTE**
- El equipo aún no ha creado el correo ni las redes sociales.
- Hasta entonces, el enlace "¿Olvidaste tu contraseña?" muestra "Escríbenos a soporte (próximamente)".
- **Bloquea:** el texto definitivo de la Fase 4.

#### P-56 · Licencia: normas de la universidad
- El equipo revisará si la universidad tiene normas sobre la propiedad intelectual de los proyectos académicos. Mientras tanto rige C-32.

### 3.3. Aplazadas

| Código | Tema | Nota |
|---|---|---|
| P-04 | Hábitos recomendados | Después de la entrega. Mismos límites (C-06). |
| P-05 | Recompensas reales predefinidas | Después de la entrega. |
| P-43 | Varias ocurrencias de un hábito por día | Mejora futura. |
| P-51 | Migración a Supabase | Después de la entrega (R-30). |
| P-60 | Música | El equipo quiere usar tracks de techno propios del sello **Nemorphic**. Se decide después de la Entrega 1 (licencia de uso, qué tracks, paquete de audio que funcione en Expo Go). El volumen ya se guarda (P-61). |
| P-52 | Backend en TypeScript | Después de la entrega. |

---

## 4. Contradicciones y actualizaciones

> El documento original **no se modifica**.

| Código | Tema | Antes | Ahora | Prevalece | Registrado en |
|---|---|---|---|---|---|
| CT-01 | Servidor | Doc §3.3: sin definir | Node + Express + MySQL | Instr. Fase 0 | C-01, C-02 |
| CT-02 | Expo o React Native CLI | Doc §3.2: sin definir | Expo, solo Android | Instr. Fase 0, Rev. 1 | C-03 |
| CT-03 | Papel del ánimo | Doc §8: solo el tono | El ánimo bajo da un mini desafío | Instr. Fase 0 | C-10 |
| CT-04 | Momento de la pérdida de HP | Doc §7.3: parece inmediata | Al vencer el plazo | Instr. Fase 0 | C-08 |
| CT-05 | Historial | Doc §6.2: "se recomienda" | Obligatorio | Instr. Fase 0 | C-07 |
| CT-06 | Hojas en el HUD | Doc §5.1: "puede" | Se muestran | Instr. Fase 0 | C-18 |
| CT-07 | Día sin hábitos | Doc §10.1: recomendación | Texto fijo; la racha se salta | Rev. 1 | C-14, P-30 |
| CT-08 | Incumplimientos múltiples | Doc §17: pendiente | Un desafío por incumplimiento | Instr. Fase 0 | C-09 |
| CT-09 | Ánimo durante el día | Doc §5.3 frente a §17 | Cambio libre; prevalece el último | Rev. 1 | C-28 |
| CT-10 | `app/AGENTS.md` | Expo Router + TS frente a un proyecto JS | Se adopta Expo Router + TS | Delegación | P-21, P-22 |
| CT-11 | Etiquetas de los mensajes | Doc frente a Instr. | Unión de ambas | Ambas | RN-MSG-02 |
| CT-12 | Plazo del desafío | Doc §9.1: "hasta las 4:00 siguiente" | 72 h + 12 h de gracia | Rev. 1 | P-09 |
| CT-13 | Recompensa de los desafíos | Doc §9: solo evitan la pérdida | ½ de las Hojas (+ XP: CT-22) | Rev. 1 | C-27 |
| CT-14 | Superdesafío | Doc §9.3: sin definir | Un reto por hábito, sin plazo; alternativa unidad a unidad | Rev. 1 | P-13, P-12 |
| CT-15 | Misiones secundarias | Doc §9.4: catálogo configurable | Por categoría, editables, 20/20, máximo 3 al día | Rev. 1, Rev. 2 | C-31 |
| CT-16 | 0 HP | Doc §9.3: bloquear el registro | Lista concreta de bloqueos y permisos | Rev. 1 | P-14 |
| CT-17 | Variante del desafío | R-12: fija | Sigue al último ánimo | Rev. 1 | C-28 |
| CT-18 | Valores de Hojas | Doc §6.2: cualquier valor ≤ 30 | Múltiplos de 5 | Rev. 1 | C-06 |
| CT-19 | Límites de los recomendados | Doc §6.2: solo los personalizados | También los recomendados | Rev. 1 | C-06 |
| CT-20 | Hábitos | Doc §6: nombre + recompensas | Medibles y con categoría | Rev. 1 | C-23 |
| CT-21 | Validación en el servidor | Doc §14.2 | Excepción temporal en la Entrega 1 | Rev. 1 | R-29 |
| CT-22 | XP de los desafíos | Rev. 1 (B9): "NO dan XP" | **20 % de la XP** del hábito | Rev. 2 (1c) | C-27 |
| CT-23 | Deshacer Día Finalizado | Interpretación de la Rev. 1: no se deshace | **Se puede deshacer hasta las 04:00** | Rev. 2 | C-29 |
| CT-24 | Alcance de la Entrega 1 | Rev. 1 (A1): incluía 2–3 cosméticos y la creación del avatar | Sin cosméticos ni creación de avatar; foco en la base | Rev. 2 | C-20 |
| CT-25 | Servidor en la Entrega 1 | C-04 / R-29: el servidor autentica y respalda | Entrega 1 **solo local**: autenticación en SQLite y sin respaldo. El backend llega después | Profesor (2026-11-26) | P-57 |
| CT-26 | Orden de las pestañas | Doc §13 / C-18: Home, Mapa, Tienda, Desafíos | Home, Mapa, **Desafíos, Tienda** | Equipo (2026-11-28) | P-62 |

---

## 5. Plantilla para nuevas entradas

```markdown
#### P-xx · Título breve
- **Estado:** Abierta | Resuelta AAAA-MM-DD (fuente) | Aplazada
- **Qué decidir / resolución:** …
- **Opciones y recomendación:** …
- **Bloquea:** Fase …
- **Documentos afectados:** …
```

## 6. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-25 | Creación (Fase 0). |
| 2026-11-25 | Revisión 1: C-20..C-28, R-29, R-30, CT-13..CT-21; decisiones delegadas. |
| 2026-11-25 | Revisión 2: C-29..C-33; resueltas P-03, P-07, P-12, P-15, P-16, P-42, P-48, P-49, P-50, P-53, P-54 y P-55; nueva P-56; CT-22..CT-24; alcance mínimo de la Entrega 1; recomendaciones aprobadas en bloque. |
| 2026-11-26 | Fase 1: P-57 (Entrega 1 sin backend) y CT-25. P-36 deja de afectar a la Entrega 1. |
| 2026-11-26 | P-58: ciclo de vida de las misiones secundarias (abandono, límite de 3 y Mapa). |
| 2026-11-27 | Fase 7: R-36 propuesta (misiones secundarias). |
| 2026-11-28 | R-36 aprobada. P-62 y CT-26: pestañas en el orden Home, Mapa, Desafíos, Tienda. |
| 2026-11-28 | Fases 8 y 9: R-37 propuesta y aprobada (detalles del cierre de jornada). |
| 2026-11-27 | R-35 aprobada. Eliminar un hábito conserva la misión de hoy (RN-HAB-06) con el aviso "Hábito eliminado · última vez hoy". "Mis hábitos" pasa al Mapa en la Fase 9. |
| 2026-11-27 | Fase 6: R-26 concretada (horizonte de 0 días) y R-35 propuesta (límites del formulario de hábitos). |
| 2026-11-27 | P-59 (categoría Desarrollo personal general), P-61 (Ajustes), P-60 aplazada (música de Nemorphic) y R-34 (registro como asistente). |
| 2026-11-27 | R-31, R-32 y R-33 aprobadas por el equipo; aviso de privacidad redactado en tono formal. |
| 2026-11-27 | Fase 4: propuestas R-31 (formato del usuario), R-32 (límites del onboarding) y R-33 (aviso de privacidad provisional). |
