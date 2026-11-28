# Reglas de negocio — The Life Game

> Equipo TechPhic · Fuente normativa de las reglas del juego · v1.2 (2026-11-25, segunda revisión de la Fase 0)

Este documento es la **fuente única de verdad** de las reglas de negocio. El código y las pruebas deben citar el código de la regla que implementan (por ejemplo, `// RN-HP-03`).

- Descripción funcional: [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md).
- Estado de las decisiones: [`DECISIONS.md`](DECISIONS.md).
- Instrucciones de implementación: [`../.claude/rules/business-logic.md`](../.claude/rules/business-logic.md).

## Convenciones

| Estado | Significado |
|---|---|
| **Confirmado** | Regla aprobada. Se implementa tal cual. |
| **Propuesta (P-xx)** | Hay un valor propuesto que falta aprobar. Solo se implementa tras el visto bueno. |
| **Abierta (P-xx)** | Falta una decisión. **No se implementa** ni se inventa un valor. |
| **Interpretación** | Lectura de Claude sobre una respuesta del equipo. Pendiente de una confirmación rápida. |
| **Entrega 1** | Simplificación válida solo para la entrega del 30-nov-2026. |

Unidades: **HP** se expresa en vidas (10 máx.) y, entre paréntesis, en **unidades de media vida** (20 unidades = 10 HP; 1 unidad = medio corazón).

---

## 1. Registro, sesión y perfil (AUTH)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-AUTH-01 | La primera apertura muestra la bienvenida y el acceso a **registro o inicio de sesión**. | Confirmado | Doc §4.1 |
| RN-AUTH-02 | El registro pide **nombre de usuario** (único, sin distinguir mayúsculas), **correo** (único) y **contraseña de mínimo 6 caracteres**, y muestra el **aviso de privacidad** con su consentimiento (C-25). Después, el onboarding pide el **propósito personal** y las **metas** (texto libre + categoría). La creación del avatar llega después de la Entrega 1: hasta entonces se usa un avatar fijo. | Confirmado | Doc §4; P-48; C-20 |
| RN-AUTH-03 | El perfil inicial tiene **10 HP (20 unidades), 0 Hojas de mate, 0 XP y nivel 0**. | Confirmado | C-05 |
| RN-AUTH-04 | Con una sesión válida, la app abre **Home** directamente. Si el usuario cerró sesión o la sesión dejó de ser válida, se muestra la autenticación. | Confirmado | Doc §4.2 |
| RN-AUTH-05 | La contraseña nunca se guarda en texto plano y el token de sesión va en el almacenamiento seguro del sistema operativo. **Entrega 1 (P-57):** hash SHA-256 con sal en SQLite y, en SecureStore, el id del usuario activo. | Confirmado | C-19; P-57 |
| RN-AUTH-06 | El propósito y las metas contextualizan los mensajes motivacionales. | Confirmado | Doc §4 |
| RN-AUTH-07 | Se inicia sesión con **nombre de usuario o correo** y contraseña. | Confirmado | Rev. Fase 0 (D1) |
| RN-AUTH-08 | **Cerrar sesión no pierde el progreso:** antes de salir se respalda en el servidor, y al volver a iniciar sesión se recarga. Si no hay conexión, se avisa y **no se borran** los datos locales. **Entrega 1 (P-57):** sin servidor; cerrar sesión no borra nada y los datos vuelven al iniciar sesión en el mismo teléfono. | Confirmado | Rev. Fase 0 (D4); P-57 |
| RN-AUTH-10 | **Ajustes** (engranaje del HUD, en todas las pestañas): el usuario puede cambiar su **nombre de usuario** (mismo formato y unicidad, R-31) y el **texto y la categoría de sus metas** (mismos límites, R-32), ajustar el volumen de la música y cerrar sesión. | Confirmado | P-61 |
| RN-AUTH-09 | No hay servicio de correo de pago. "¿Olvidaste tu contraseña?" muestra un **enlace al correo de soporte** (P-40) y el equipo restablece la contraseña a mano, tras verificar la identidad. | Confirmado / Abierta (P-40) | Rev. Fase 0 (D3) |

## 2. Hábitos (HAB)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-HAB-01 | Hay hábitos **personalizados** (crear, editar, eliminar, programar) y **recomendados** (catálogo del equipo, aplazado tras la entrega, P-04). | Confirmado | Doc §6 |
| RN-HAB-02 | Recompensa de cada hábito (recomendado o personalizado): **Hojas de mate ∈ {0, 5, 10, 15, 20, 25, 30}** y **XP ∈ {0, 10, 20, 30, 40, 50}**, presentada como dificultad (Fácil 10 · Media 20–30 · Difícil 40–50). | Confirmado | C-06 |
| RN-HAB-03 | El usuario programa libremente cada hábito por **días de la semana o fechas concretas**, desde el Mapa. **Entrega 1:** la programación se elige en el formulario del hábito; la tabla de programación del Mapa llega en la Fase 9. | Confirmado | Doc §6.3 |
| RN-HAB-04 | Cada fecha programada genera una **ocurrencia con ID propio**. Hay como máximo **una por hábito y jornada** en la v1; varias al día es una mejora futura (P-43). | Confirmado | Doc §6.3; Rev. Fase 0 (B14) |
| RN-HAB-05 | **Editar** un hábito: las ocurrencias de jornadas futuras se **regeneran** con los valores nuevos; la de **hoy conserva** los suyos; las de jornadas cerradas **nunca cambian**. | Confirmado | C-07 |
| RN-HAB-06 | **Eliminar** un hábito: deja de programarse y se eliminan sus ocurrencias futuras; la de **hoy se conserva** (así no se puede borrar un hábito para esquivar su desafío) y el historial no se toca (eliminación lógica). La misión de hoy muestra "Hábito eliminado · última vez hoy". | Confirmado | C-07 |
| RN-HAB-07 | Cambiar la programación solo afecta a las ocurrencias **futuras**. | Confirmado | Doc §10.2 |
| RN-HAB-08 | Todo hábito es **medible**: tiene **cantidad** (entero > 0) y **unidad** (minutos, páginas, repeticiones, km, vasos, veces u otra). | Confirmado | C-23 |
| RN-HAB-09 | Todo hábito tiene una **categoría** que elige el usuario entre 17 (P-59): Desarrollo personal general, Ejercicio, Estudio, Lectura, Arte y creatividad, Mindfulness, Salud y alimentación, Autocuidado, Hogar y orden, Finanzas personales, Relaciones y vida social, Trabajo y productividad, Espiritualidad, Bienestar digital, Ocio y hobbies, Voluntariado y comunidad, Otro. | Confirmado | C-23; P-42 |

## 3. Jornada y registro de cumplimiento (DAY)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-DAY-01 | La **jornada** termina a las **4:00 a. m. del día siguiente** (hora del teléfono). Lo registrado entre las 00:00 y las 03:59 pertenece a la jornada anterior. | Confirmado | Doc §6.5; P-19 |
| RN-DAY-02 | Se guardan la **fecha de jornada** y la **hora real** de cada registro. | Confirmado | Doc §6.5 |
| RN-DAY-03 | El usuario marca **manualmente** cada ocurrencia como cumplida o incumplida, solo con la jornada abierta y HP > 0 (RN-NAV-04). | Confirmado | Doc §6.4; P-14 |
| RN-DAY-04 | Lo que sigue **pendiente al cierre** se registra como **incumplido** automáticamente. | Confirmado | Doc §6.4 |
| RN-DAY-05 | Una ocurrencia **cumplida** acredita sus Hojas de mate **y** su XP **una sola vez**. | Confirmado | Doc §6.4; Rev. Fase 0 (B6) |
| RN-DAY-06 | Marcar una ocurrencia como **incumplida** genera su desafío en ese momento. | Confirmado | Doc §9.1 |
| RN-DAY-07 | Tras marcar, hay una **ventana para deshacer de 10 s** (configurable). Deshacer revierte por completo el efecto: la acreditación o el desafío generado. Pasada la ventana, el registro es **definitivo**. | Confirmado | P-29 |
| RN-DAY-08 | Las **"misiones del día"** son los hábitos programados de la jornada. | Confirmado | C-26 |

## 4. Hojas de mate (ECO)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-ECO-01 | Las Hojas se **obtienen** al cumplir hábitos (valor completo), al completar desafíos por incumplimiento o de recuperación (**la mitad, redondeada hacia abajo**, RN-DES-06) y con misiones secundarias (**20**). Se **gastan** en recompensas reales y cosméticos. | Confirmado | Doc §7.1; C-27; C-31 |
| RN-ECO-02 | Cada movimiento se registra con un identificador y una clave de idempotencia. El saldo es auditable. | Confirmado | Doc §11.1 |
| RN-ECO-03 | El saldo **nunca es negativo**. No hay gasto con saldo insuficiente. | Confirmado | Doc §15.5 |
| RN-ECO-04 | Hojas, XP y HP son independientes. | Confirmado | Doc §7.1 |

## 5. Experiencia y niveles (XP)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-XP-01 | La XP se obtiene con hábitos cumplidos (valor completo), desafíos por incumplimiento o de recuperación (**20 %** de la XP del hábito) y misiones secundarias (20). | Confirmado | C-27; C-31; CT-22 |
| RN-XP-02 | El nivel se **deriva** de la XP total. Nivel inicial: 0. XP total para el nivel *n* = `40·n² + 60·n` (paso = `80·n + 20`), configurable y sin máximo. | Confirmado | Doc §7.2; C-05; P-03 |
| RN-XP-03 | Subir de nivel **desbloquea cosméticos**. La XP nunca disminuye. | Confirmado | Doc §7.2; Rev. Fase 0 (B6) |
| RN-XP-04 | Cada movimiento de XP queda registrado con su clave de idempotencia. | Confirmado (técnica R-06) | Instr. Fase 0 §6 |

## 6. Puntos de vida (HP)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-HP-01 | HP entre **0 y 10** (0..20 unidades). | Confirmado | Doc §7.3 |
| RN-HP-02 | HP inicial: **10 (20 unidades)**. | Confirmado | C-05 |
| RN-HP-03 | Un desafío por incumplimiento **vencido sin completar** resta **0.5 HP (1 unidad)** al vencer su plazo. **Nunca** se resta al marcar el incumplimiento. | Confirmado | C-08 |
| RN-HP-04 | Las pérdidas se **acumulan** (no hay tope diario). | Confirmado | Doc §7.3 |
| RN-HP-05 | Una ocurrencia produce **como máximo una** pérdida. | Confirmado | Doc §15.5 |
| RN-HP-06 | **Recuperación:** cada vida perdida (1 unidad) genera **un desafío de recuperación** del mismo hábito, de tamaño normal y **sin plazo**. Completarlo devuelve **1 unidad (medio corazón)**, sin pasar de 20, y da ½ de las Hojas + 20 % de la XP (C-27). | Confirmado | Doc §9.2; P-12 |
| RN-HP-07 | Completar el **Superdesafío** establece HP = **10 (20 unidades)**. | Confirmado | Doc §9.3 |
| RN-HP-08 | Al llegar a **0 HP** se activa **un** Superdesafío. | Confirmado | Doc §9.3 |
| RN-HP-09 | El HP no baja de 0. | Confirmado | Doc §15.5 |
| RN-HP-10 | **A 0 HP**, completar cualquier desafío disponible (de recuperación o por incumplimiento todavía en plazo) devuelve **1 unidad** y **elimina el Superdesafío**: el usuario pierde la opción de restaurar el máximo con él. | Confirmado | P-12 |

## 7. Estado de ánimo (MOOD)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-MOOD-01 | Estados: **Muy feliz, Bien, Neutral, Desanimado, Muy mal**. | Confirmado | Doc §8 |
| RN-MOOD-02 | Al abrir la app se muestra el mensaje motivacional y, **debajo, el selector de ánimo**. El estado puede **cambiarse sin límite** durante la jornada. | Confirmado | C-28; Rev. Fase 0 (B3, C8) |
| RN-MOOD-03 | El ánimo no cambia **por sí solo** las cantidades de Hojas, XP ni HP. Determina el tono del mensaje y la **variante** del desafío. | Confirmado | CT-03 |
| RN-MOOD-04 | **Muy feliz / Bien:** mensaje sobre el propósito + **desafío normal** + aviso de la posible pérdida de 0.5 HP. | Confirmado | C-11 |
| RN-MOOD-05 | **Neutral:** desafío normal, con tono neutral y respetuoso. | Confirmado | C-11 |
| RN-MOOD-06 | **Desanimado / Muy mal:** (1) sin descuento inmediato; (2) mensaje empático; (3) reconoce que hay días difíciles; (4) recuerda el propósito sin culpabilizar; (5) ofrece un **mini desafío** en lugar del normal; (6) más pequeño y alcanzable; (7) completarlo conserva el HP; (8) si lo rechaza, puede pasarse al normal o deshacer el rechazo; si al vencer no completó ninguno, pierde 0.5 HP. | Confirmado | C-10, C-12 |
| RN-MOOD-07 | **Sin estado registrado** → desafío normal. | Confirmado | C-11 |
| RN-MOOD-08 | Prevalece el **último estado registrado** de la jornada: define la variante de los desafíos **pendientes de esa jornada** mientras siga abierta, y es el estado que se guarda en el **Mapa**. Al cerrarse la jornada, la variante queda fija. | Confirmado | C-28; P-11 |

> **La constancia no significa avanzar siempre con la misma intensidad. Incluso un pequeño escalón representa progreso.**

## 8. Desafíos (DES)

### 8.1. Tipos

| Tipo | Origen | Al completarlo | Si no se completa |
|---|---|---|---|
| **Desafío por incumplimiento** (normal) | Ocurrencia incumplida con el último ánimo Muy feliz, Bien, Neutral o sin registro | Sin pérdida de HP + **½ de las Hojas** (hacia abajo) + **20 % de la XP** | −1 unidad (medio corazón) al vencer (72 h) |
| **Mini desafío** | Ocurrencia incumplida con el último ánimo Desanimado o Muy mal | Igual que el normal | Igual que el normal |
| **Desafío de recuperación** | Cada vida perdida (1 unidad) | +1 unidad de HP (tope 20) + ½ de las Hojas + 20 % de la XP | Sin efecto (sin plazo) |
| **Superdesafío** | Llegar a 0 HP | HP = 20 unidades (sus retos no dan Hojas ni XP) | Sin plazo: sigue disponible |

### 8.2. Reglas

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-DES-01 | Sección **Desafíos**; nunca "castigo". | Confirmado | C-16 |
| RN-DES-02 | Los cuatro tipos de la tabla 8.1 se distinguen claramente en datos e interfaz. | Confirmado | Instr. Fase 0 §5.7 |
| RN-DES-03 | Cada ocurrencia incumplida genera **exactamente un** desafío por incumplimiento, asociado a su hábito, con la acción concreta y su criterio medible. | Confirmado | C-09 |
| RN-DES-04 | Se genera al marcar el incumplimiento o, si la ocurrencia quedó pendiente, en el cierre de la jornada. | Confirmado | Doc §9.1 |
| RN-DES-05 | El normal y el mini **no coexisten** para una ocurrencia: es **un solo desafío** cuya variante puede cambiar (RN-MOOD-08, RN-DES-14). Solo hay una posible penalización. | Confirmado | Instr. Fase 0 §5.6 |
| RN-DES-06 | Completarlo **dentro del plazo**: sin pérdida de HP, **½ de las Hojas** del hábito (redondeo **hacia abajo**: 5 → 2, 15 → 7, 25 → 12) y **20 % de su XP** (50 → 10, 30 → 6). **No** convierte la ocurrencia en cumplida ni cambia el porcentaje del día. | Confirmado | C-27; P-49 |
| RN-DES-07 | Si vence sin completarse: **−0.5 HP una sola vez**. | Confirmado | C-08 |
| RN-DES-08 | **No** se completa un desafío vencido (`now ≥ deadline`), aunque el vencimiento no se haya procesado todavía. | Confirmado | Doc §15.5 |
| RN-DES-09 | Mini desafío: relacionado directamente con el hábito, nunca aleatorio, más pequeño y alcanzable, medible, sin segunda penalización. | Confirmado | Instr. Fase 0 §5.6 |
| RN-DES-10 | **Plazo: 72 horas** desde la creación, igual para incumplimientos manuales y automáticos (en los automáticos cuentan desde el cierre lógico de las 04:00). **Gracia:** si el plazo venció mientras la app estaba cerrada, al abrirla se conceden **12 horas** desde ese momento, una sola vez por desafío. | Confirmado | P-09 |
| RN-DES-11 | **Prevenir no es lo mismo que recuperar:** el desafío por incumplimiento evita una pérdida; el de recuperación devuelve HP ya perdido. Son entidades distintas. | Confirmado | Doc §9.2 |
| RN-DES-12 | **Autodeclaración:** el usuario confirma que cumplió el criterio medible ("Repasé 6 min"). | Confirmado | P-08 |
| RN-DES-13 | **Superdesafío:** se activa a 0 HP y contiene **un reto por cada hábito activo**, relacionado con ese hábito. **No tiene plazo**. Al completar **todos** los retos, HP = 10. Se elimina si el usuario recupera HP por la otra vía (RN-HP-10). | Confirmado | P-13 |
| RN-DES-14 | Tras **rechazar** un mini desafío, el usuario puede **cambiarlo por el normal** o **deshacer el rechazo** mientras esté en plazo. | Confirmado | C-12 |
| RN-DES-15 | **Tamaño:** el desafío normal es el 50 % de la cantidad del hábito y el mini el 10 %, redondeados hacia arriba con un mínimo de 1. Los desafíos de recuperación y los retos del Superdesafío usan el tamaño normal. | Confirmado | P-07 |
| RN-DES-16 | Home y Desafíos muestran el **tiempo restante** de cada desafío. | Confirmado | C-24 |

## 9. Misiones secundarias (MIS)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-MIS-01 | Son **voluntarias** y están en la sección **Desafíos**. Un botón abre un modal que **felicita** al usuario por ir más allá de lo programado y le permite **elegir una categoría**. | Confirmado | Rev. Fase 0 (C6) |
| RN-MIS-02 | La recompensa es fija: **20 Hojas + 20 XP** (configurable). Se muestra antes de aceptar. | Confirmado | C-31 |
| RN-MIS-03 | La recompensa se acredita **una sola vez** por misión. | Confirmado | Doc §15.5 |
| RN-MIS-04 | Como máximo **3 misiones secundarias por jornada**; las abandonadas **no cuentan** (P-58). La app **sugiere** una misión medible según las metas y hábitos de la categoría, y el usuario puede **modificarla** o escribir la suya (descripción, cantidad y unidad). | Confirmado | C-31 |
| RN-MIS-05 | **Bloqueadas a 0 HP.** | Confirmado | P-14 |
| RN-MIS-06 | El usuario puede **abandonar** una misión aceptada. Al cerrar la jornada, las misiones aceptadas sin completar pasan a **abandonadas** automáticamente. Abandonar no quita HP, Hojas ni XP. | Confirmado | P-58 |
| RN-MIS-07 | Las misiones secundarias **no cuentan** en el porcentaje del Mapa ni en la racha. El porcentaje es solo de las misiones del día (hábitos programados). | Confirmado | P-58 |

## 10. Mapa (MAP)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-MAP-01 | Calendario gamificado: programar hábitos y revisar la trayectoria (días anteriores, resultados, mensajes y estado de ánimo). | Confirmado | Doc §10 |
| RN-MAP-02 | Porcentaje = **hábitos cumplidos / hábitos programados × 100**. Todos pesan igual. Los desafíos no cuentan. | Confirmado | Rev. Fase 0 (B6) |
| RN-MAP-03 | Perfecto 100 %, Muy bueno 85–99 %, Parcial 40–84 %, Crítico < 40 %, **sin redondear**. | Confirmado | C-14 |
| RN-MAP-04 | Sin hábitos programados: **"Sin actividades programadas"**, nunca Perfecto. | Confirmado | C-14 |
| RN-MAP-05 | El resumen de una jornada cerrada no cambia. | Confirmado | Doc §10.2 |
| RN-MAP-06 | Al tocar un día anterior se muestran su resumen y un **mensaje según su rendimiento**. | Confirmado | Rev. Fase 0 (C8) |
| RN-MAP-07 | Cada día lleva el color de su clasificación y, además, un icono o texto (accesibilidad). | Confirmado | Doc §10.1 |
| RN-MAP-08 | El Mapa guarda el **último estado de ánimo** de cada jornada. | Confirmado | C-28 |
| RN-MAP-09 | Las jornadas que transcurren con **0 HP** quedan **"En pausa"**: sus ocurrencias pasan a `PAUSED`, no cuentan en el porcentaje, no generan desafíos y se saltan en la racha. | Confirmado | P-50 |

## 11. Tienda y avatar (SHOP)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-SHOP-01 | Dos categorías: **recompensas de la vida real** y **cosméticos**. | Confirmado | Doc §11 |
| RN-SHOP-02 | Recompensas reales: las **crea el usuario** (nombre + costo entero **≥ 20 Hojas**, sin máximo) y se canjean **sin límite de veces**. Las predefinidas, después de la entrega (P-05). | Confirmado | C-30 |
| RN-SHOP-03 | Un canje valida el saldo, descuenta las Hojas y registra la transacción, de forma idempotente. | Confirmado | Doc §11.1 |
| RN-SHOP-04 | Cosméticos: un **nivel mínimo** y un precio en Hojas. Ranuras: **cabeza, cara, cuello, pecho, manos, piernas, pies**. **No entran en la Entrega 1.** Primer catálogo: Gorra (nivel 1, 30), Cadena (nivel 2, 35), Gafas (nivel 2, 40), Hoodie (nivel 3, 50). | Confirmado | P-16; C-20 |
| RN-SHOP-05 | Para comprar hacen falta nivel ≥ mínimo **y** saldo suficiente. | Confirmado | Doc §15.5 |
| RN-SHOP-06 | Lo comprado queda para siempre en el inventario, y no se compra dos veces. | Confirmado | Doc §11.2 |
| RN-SHOP-07 | Equipar o quitar un cosmético **no cuesta** nada. Un cosmético equipado por ranura. | Confirmado | Doc §11.2; P-16 |
| RN-SHOP-08 | Avatar en **pixel art**, sencillo en la Entrega 1. Refleja lo equipado y aparece en el HUD. | Confirmado | C-22 |

## 12. Cierre de jornada (CLOSE)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-CLOSE-01 | Cierre **automático a las 04:00** del día siguiente o **manual con Día Finalizado**. Si la app estaba cerrada, se **reconcilia** al abrirla, al volver al primer plano o al recuperar la conexión. | Confirmado | C-13 |
| RN-CLOSE-02 | Orden: (1) programados; (2) cumplidos; (3) pendientes → incumplidos; (4) generar desafíos; (5) vencimientos (72 h y gracia); (6) pérdidas de HP (Superdesafío si se llega a 0); (7) porcentaje; (8) clasificación; (9) racha; (10) mensaje. | Confirmado | Doc §12.1 |
| RN-CLOSE-03 | **Idempotente**: cada jornada se cierra una sola vez. | Confirmado | C-13 |
| RN-CLOSE-04 | Las jornadas vencidas se procesan **todas y en orden cronológico**. | Confirmado | Doc §15.4 |
| RN-CLOSE-05 | **Recordatorio** local entre las 18:00 y las 20:00 si hay hábitos pendientes. Llega **después de la entrega**. | Confirmado | P-47 |
| RN-CLOSE-06 | Tras **Día Finalizado**, Home muestra el **mensaje de cierre** según el rendimiento y la meta. | Confirmado | P-34 |
| RN-CLOSE-09 | **Deshacer Día Finalizado:** se puede hacer mientras no lleguen las 04:00 de esa jornada. Revierte **solo** lo que hizo ese cierre: las ocurrencias que el cierre marcó como incumplidas vuelven a `PENDING`, se eliminan sus desafíos, se borra el resumen de la jornada y se restaura la racha. Los vencimientos de desafíos anteriores (que dependen del reloj) se mantienen. Un cierre automático no se puede deshacer. | Confirmado / Interpretación (detalle) | C-29 |
| RN-CLOSE-07 | **Racha** = jornadas Perfecto consecutivas. Las jornadas "Sin actividades programadas" **se saltan**. | Confirmado | P-30 |
| RN-CLOSE-08 | Tras cerrar una jornada se hace el **respaldo** en el servidor si hay conexión. | Después de la Entrega 1 (P-57) | R-29 |

## 13. HUD y navegación (NAV)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-NAV-01 | Pestañas: **Home, Mapa, Desafíos, Tienda**, con el HUD siempre visible. | Confirmado | Doc §13; orden según P-62 (CT-26) |
| RN-NAV-02 | HUD: avatar, nombre, nivel, barra de XP, **diez corazones** (lleno, medio o vacío), racha y saldo de Hojas. | Confirmado | C-18 |
| RN-NAV-03 | El HUD se actualiza en cuanto cambia una variable. | Confirmado | Doc §5.1 |
| RN-NAV-04 | **A 0 HP**. **Bloqueado:** programar en el Mapa, marcar hábitos, comprar y canjear en la Tienda, misiones secundarias. **Permitido:** personalizar el avatar (equipar lo comprado), el Superdesafío, los desafíos que devuelven HP y **consultar** (solo lectura). Lo bloqueado se muestra deshabilitado y explica por qué. | Confirmado | P-14 |

## 14. Mensajes motivacionales (MSG)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-MSG-01 | Los mensajes salen de un **JSON local amplio**. La IA es una evolución futura, nunca un requisito. | Confirmado | C-15 |
| RN-MSG-02 | Etiquetas: estado emocional, propósito, categoría de la meta, rendimiento, contexto y tipo de actividad (categoría). | Confirmado | CT-11 |
| RN-MSG-03 | Contextos: **apertura de la app** (meta y propósito), **cierre de jornada** (rendimiento), **al invocar un mini desafío** y **al tocar un día anterior** (rendimiento). | Confirmado | P-32 |
| RN-MSG-04 | En estados bajos, tono empático y **nunca culpabilizador**. | Confirmado | Instr. Fase 0 |
| RN-MSG-05 | Solo **contenido propio o con licencia que permita uso comercial**: el repositorio es público y hay ambición comercial. | Confirmado | P-32 |

## 15. Persistencia y sincronización (SYNC)

| Código | Regla | Estado | Fuente |
|---|---|---|---|
| RN-SYNC-01 | Primero se guarda en local; el servidor respalda. | Confirmado | C-04 |
| RN-SYNC-02 | La app funciona sin conexión con sus datos locales. | Confirmado | Doc §14.3 |
| RN-SYNC-03 | Reintentar una operación nunca duplica sus efectos. | Confirmado | Doc §3.1 |
| RN-SYNC-04 | Las operaciones críticas se validan también en el servidor. **Excepción temporal en la Entrega 1** (CT-21): respaldo por instantánea. | Confirmado (Fase 11) | Doc §14.2 |
| RN-SYNC-05 | La interfaz indica discretamente si hay cambios sin respaldar o si el respaldo falló. | Confirmado | Doc §14.3 |
| RN-SYNC-06 | No se hace una petición al servidor por cada interacción. | Confirmado | Instr. Fase 0 |
| RN-SYNC-07 | **Un dispositivo activo por cuenta** en la v1. | Confirmado | P-18 |
| RN-SYNC-08 | **Respaldo por instantánea** (en la Entrega 1 solo si da tiempo): la app sube una copia completa al cerrar cada jornada y antes de cerrar sesión, y la restaura al iniciar sesión en un dispositivo sin datos. Mientras no exista, **cerrar sesión nunca borra los datos locales**. | Entrega 1 (opcional) | R-29; C-20 |

---

## 16. Máquinas de estado

### 16.1. Ocurrencia (`HabitOccurrence.status`)

```text
PENDING ──(marcar cumplido; jornada abierta; HP > 0)──▶ COMPLETED   [+Hojas +XP una vez]
PENDING ──(marcar incumplido; jornada abierta; HP > 0)─▶ MISSED      [genera desafío]
PENDING ──(cierre de jornada)──────────────────────────▶ MISSED      [genera desafío]
COMPLETED / MISSED ──(deshacer dentro de los 10 s)─────▶ PENDING     [revierte el efecto]
PENDING ──(ocurrencia futura eliminada)────────────────▶ CANCELLED   [no cuenta]
PENDING ──(jornada mientras HP = 0, si se aprueba P-50)▶ PAUSED      [no cuenta]
```

### 16.2. Desafío por incumplimiento (variante `NORMAL` | `MINI`)

```text
PENDING ──(completar; now < deadline)──────────────▶ COMPLETED  [sin pérdida; +½ Hojas; +20 % XP]
PENDING ──(rechazar; solo MINI)────────────────────▶ DECLINED
DECLINED ──(deshacer rechazo; en plazo)────────────▶ PENDING (MINI)
DECLINED ──(pasar al normal; en plazo)─────────────▶ PENDING (NORMAL)
PENDING | DECLINED ──(vence el plazo)──────────────▶ EXPIRED    [−1 unidad de HP, una vez]
```

- Mientras la jornada de origen esté abierta, la variante sigue al último estado de ánimo (RN-MOOD-08).
- `deadline = created_at + 72 h`. Si `now > deadline` en la primera reconciliación tras un periodo con la app cerrada, `deadline = now + 12 h`, una sola vez (`grace_applied = true`).
- Claves: `hp-penalty:<occurrenceId>` y `challenge-reward:<challengeId>`.

### 16.3. Recuperación y Superdesafío

```text
RECOVERY: PENDING ──(completar)──▶ COMPLETED   [+1 unidad, tope 20]           (detalle: P-12)
SUPER:    PENDING (al llegar a 0 HP) ──(completar todas sus tareas)──▶ COMPLETED [HP = 20]
SUPER:    PENDING ──(el usuario recupera HP con otro desafío a 0 HP)──▶ CANCELLED
SUPER (tareas): una por hábito activo; cada tarea PENDING ──▶ COMPLETED
```

`PENDING` significa "activo, sin resolver". Estados de `Challenge`: `PENDING`, `COMPLETED`, `DECLINED`, `EXPIRED` y `CANCELLED`.

### 16.4. Jornada (`DailySummary`)

```text
OPEN ──(Día Finalizado | 04:00 | reconciliación)──▶ CLOSED   [una sola vez; source = MANUAL | AUTO]
CLOSED (MANUAL) ──(deshacer antes de las 04:00)────▶ OPEN     [revierte los efectos propios del cierre]
```

---

## 17. Invariantes de integridad

| Código | Invariante | Reglas |
|---|---|---|
| INT-01 | Una ocurrencia acredita sus recompensas como máximo una vez (deshacer la revierte). | RN-DAY-05, RN-DAY-07 |
| INT-02 | Un incumplimiento descuenta HP como máximo una vez. | RN-HP-05 |
| INT-03 | `0 ≤ unidades ≤ 20` siempre. | RN-HP-01 |
| INT-04 | Hojas de un hábito ∈ {0, 5, …, 30}; XP ≤ 50. | RN-HAB-02 |
| INT-05 | Sin gasto con saldo insuficiente; el saldo nunca es negativo. | RN-ECO-03 |
| INT-06 | Un desafío por ocurrencia incumplida y un Superdesafío activo como máximo. | RN-DES-03, RN-HP-08 |
| INT-07 | No se completa un desafío vencido. | RN-DES-08 |
| INT-08 | Editar o eliminar un hábito no altera el historial. | RN-HAB-05, RN-HAB-06 |
| INT-09 | Una jornada se procesa una sola vez. | RN-CLOSE-03 |
| INT-10 | No se compra un cosmético sin el nivel y el saldo necesarios. | RN-SHOP-05 |
| INT-11 | Equipar no descuenta moneda. | RN-SHOP-07 |
| INT-12 | El normal y el mini nunca penalizan la misma ocurrencia por separado. | RN-DES-05 |
| INT-13 | La recuperación de HP no se confunde con la prevención. | RN-DES-11 |
| INT-14 | Los saldos guardados coinciden con la suma de sus movimientos. | RN-ECO-02, RN-XP-04 |
| INT-15 | Local y servidor son consistentes: el respaldo restaura exactamente el estado guardado. | RN-SYNC-08 |
| INT-16 | La recompensa de un desafío (½ Hojas) se acredita una sola vez. | RN-DES-06 |
| INT-17 | A 0 HP, ninguna acción bloqueada produce efectos. | RN-NAV-04 |
| INT-18 | La gracia de 12 h se aplica como máximo una vez por desafío. | RN-DES-10 |
| INT-19 | Deshacer Día Finalizado deja la jornada exactamente como estaba antes del cierre (salvo los vencimientos que dependen del reloj). Volver a cerrarla no duplica efectos. | RN-CLOSE-09 |
| INT-20 | Como máximo 3 misiones secundarias no abandonadas por jornada. | RN-MIS-04 |

---

## 18. Escenarios de referencia (base para las pruebas)

> Ejemplo de jornada: viernes 13, que cierra el sábado 14 a las 04:00.

| Código | Escenario | Resultado esperado |
|---|---|---|
| ESC-01 | Marcar cumplida una ocurrencia (10 Hojas, 20 XP) dos veces (doble toque o reintento). | +10 Hojas y +20 XP **una sola vez**. |
| ESC-02 | Crear un hábito con 12 Hojas, 35 Hojas o 51 XP. | Rechazado. 30 Hojas y 50 XP se aceptan. |
| ESC-03 | Hábito del viernes 13 marcado el sábado 14 a las 02:30. | Válido: pertenece a la jornada del 13. |
| ESC-04 | El mismo hábito marcado el sábado 14 a las 04:01. | Rechazado: la jornada cerró y ya es incumplido. |
| ESC-05 | Vencen tres desafíos sin completar. | −1.5 HP (−3 unidades). |
| ESC-06 | HP = 0.5 y vencen dos desafíos. | HP = 0, sin valores negativos. Se activa **un** Superdesafío. |
| ESC-07 | HP = 9.5 y se completa un desafío de recuperación. | HP = 10, nunca 10.5. |
| ESC-08 | Último ánimo "Muy mal"; se incumple "Estudiar programación 60 min". | Mensaje empático + mini desafío "Estudiar programación 6 min" (según P-07). Sin desafío normal ni pérdida inmediata. |
| ESC-09 | ESC-08 con el mini completado dentro del plazo (hábito de 10 Hojas y 20 XP). | Sin pérdida de HP, +5 Hojas, +4 XP. La ocurrencia sigue incumplida. |
| ESC-10 | ESC-08 con el mini rechazado y, después, el normal completado en plazo. | Sin pérdida. Un solo desafío durante todo el proceso. |
| ESC-11 | Último ánimo "Bien"; desafío normal no completado en 72 h. | −0.5 HP al vencer. |
| ESC-12 | Día Finalizado y, después, la reconciliación de la misma jornada. | Efectos una sola vez. |
| ESC-13 | La app estuvo cerrada 5 días con desafíos pendientes. | Jornadas procesadas en orden. Los desafíos vencidos durante el cierre reciben **12 h de gracia** desde la apertura, una vez. |
| ESC-14 | Jornada con 0 hábitos programados. | "Sin actividades programadas"; la racha no se rompe ni suma. |
| ESC-15 | 20/20; 17/20; 8/20; 7/20; 11/13. | Perfecto; Muy bueno; Parcial; Crítico; **Parcial** (84,6 %). |
| ESC-16 | Comprar un cosmético con nivel insuficiente; con saldo insuficiente; equipar uno comprado. | Rechazado; rechazado; equipado sin cargo. |
| ESC-17 | Canjear una recompensa de 50 Hojas con un saldo de 40. | Rechazado, sin transacción. |
| ESC-18 | Editar las recompensas de un hábito con ocurrencias cerradas, la de hoy y futuras. | Cerradas sin cambios; la de hoy conserva sus valores; las futuras tienen los nuevos. |
| ESC-19 | Completar un desafío pasadas sus 72 h (sin gracia aplicable). | Rechazado. |
| ESC-20 | Completar una recuperación con un desafío por incumplimiento pendiente. | +1 unidad de HP. El pendiente sigue igual. |
| ESC-21 | Con 0 HP: intentar marcar un hábito, programar, comprar o aceptar una misión; equipar un cosmético. | Las cuatro primeras se rechazan; equipar funciona. |
| ESC-22 | Con 0 HP, completar un desafío por incumplimiento que sigue en plazo. | HP = 1 unidad y Superdesafío `CANCELLED`. |
| ESC-23 | Superdesafío con 4 hábitos activos; completar las 4 tareas. | HP = 10 (20 unidades). Sin plazo. |
| ESC-24 | Marcar cumplido y deshacer a los 5 s; intentar deshacer a los 15 s. | El primero revierte las Hojas y la XP; el segundo se rechaza. |
| ESC-25 | Se incumple con "Muy mal" (mini) y después se registra "Bien" en la misma jornada. | El desafío pendiente pasa a normal. El Mapa guarda "Bien". |
| ESC-26 | Completar una misión secundaria (y repetir la petición). | +20 Hojas y +20 XP una sola vez. |
| ESC-27 | Día Finalizado a las 22:00 con 2 hábitos pendientes; deshacer a las 23:00; volver a cerrar a las 23:30. | Tras deshacer: los 2 hábitos vuelven a estar pendientes, sin desafíos ni resumen. El segundo cierre produce un solo resumen y 2 desafíos. Deshacer a las 04:01 se rechaza. |
| ESC-28 | Aceptar una 4.ª misión secundaria en la misma jornada. | Rechazada (máximo 3). |
| ESC-29 | Crear una recompensa real de 15 Hojas. | Rechazada (mínimo 20). |
| ESC-30 | Completar un desafío de un hábito de 25 Hojas y 30 XP. | +12 Hojas, +6 XP. |
| ESC-31 | Vence un desafío (−1 unidad) y se completa su desafío de recuperación (hábito de 10 Hojas y 20 XP). | Se recupera 1 unidad, +5 Hojas, +4 XP. |

---

## 19. Trazabilidad con las reglas originales (Doc §16)

| Original | Nuevo código |
|---|---|
| RN-01 | RN-SYNC-01 |
| RN-02 | RN-AUTH-01, RN-AUTH-04 |
| RN-03 | RN-AUTH-02 |
| RN-04, RN-05 | RN-HAB-01 |
| RN-06 | RN-HAB-02 (actualizada: CT-18, CT-19) |
| RN-07 | RN-HAB-03 |
| RN-08 | RN-DAY-03, RN-DAY-04 |
| RN-09 | RN-DAY-01, RN-CLOSE-01 |
| RN-10 | RN-DAY-05 |
| RN-11 | RN-DES-03 |
| RN-12 | RN-HP-03, RN-HP-04 (CT-04) |
| RN-13 | RN-HP-01 |
| RN-14 | RN-HP-06 |
| RN-15 | RN-HP-08, RN-DES-13, RN-NAV-04 |
| RN-16 | RN-MIS-01, RN-MIS-02 (CT-15) |
| RN-17 | RN-ECO-01 |
| RN-18 | RN-SHOP-04 |
| RN-19 | RN-MAP-02, RN-MAP-03 |
| RN-20 | RN-MSG-01 |

## 20. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-25 | v1.0 (Fase 0). |
| 2026-11-26 | P-58: RN-MIS-06 y RN-MIS-07; RN-MIS-04 e INT-20 excluyen las misiones abandonadas. |
| 2026-11-27 | Fase 6: RN-HAB-03 (programación en el formulario en la Entrega 1) y RN-HAB-09 (17 categorías). |
| 2026-11-27 | RN-AUTH-10 (Ajustes, P-61). Categorías: 17 con *Desarrollo personal general* (P-59). |
| 2026-11-28 | RN-NAV-01: orden de las pestañas Home, Mapa, Desafíos, Tienda (P-62). |
| 2026-11-26 | Fase 1: notas de la Entrega 1 sin backend (P-57) en RN-AUTH-05, RN-AUTH-08 y RN-CLOSE-08. Sin cambios en las reglas del juego. |
| 2026-11-25 | v1.2: segunda revisión. Desafíos con ½ Hojas (hacia abajo) + 20 % de XP; recuperación definida; curva de niveles y valores de XP; 16 categorías; máximo 3 misiones al día, editables; jornadas en pausa a 0 HP; recompensa real ≥ 20 Hojas; deshacer Día Finalizado; contraseña de mínimo 6 caracteres; cosméticos después de la Entrega 1. |
| 2026-11-25 | v1.1: respuestas de la revisión de la Fase 0. Plazo de 72 h + gracia; desafíos con ½ Hojas; ánimo cambiante (último prevalece); deshacer en 10 s; 0 HP; Superdesafío por hábito; misiones 20/20; hábitos medibles con categoría; Hojas en múltiplos de 5; respaldo por instantánea en la Entrega 1. |
