# Especificación funcional — The Life Game

> Equipo TechPhic (Juan José López, David Pachón, Dylan Arredondo) · Versión 1.3 · 2026-11-25 (segunda revisión de la Fase 0)

## 0. Control del documento

| Elemento | Descripción |
|---|---|
| Producto | The Life Game: app móvil **Android** de hábitos con mecánicas RPG y estética **pixel art**. |
| Base | `Documento_Explicativo_The_Life_Game.md` v1.0, que se conserva sin cambios. |
| Actualizaciones | Instrucciones de la Fase 0 y respuestas de la revisión de la Fase 0 (25-nov-2026). Ver `DECISIONS.md` §4. |
| Próximo hito | **Entrega 1: lunes 30-nov-2026** (§1.1). |
| Relacionados | [`BUSINESS_RULES.md`](BUSINESS_RULES.md) (normativo) · [`DECISIONS.md`](DECISIONS.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`DATA_MODEL.md`](DATA_MODEL.md) |

**Notación.** `RN-…` remite a `BUSINESS_RULES.md`; `C-…`, `R-…`, `P-…` y `CT-…` remiten a `DECISIONS.md`. **[Abierta P-xx]** significa que no se implementa hasta decidirlo.

---

## 1. Propósito del producto

The Life Game ayuda a organizar actividades personales, mantener la constancia y ver el progreso mediante:

- hábitos **medibles** agrupados por categorías;
- un calendario gamificado (el **Mapa**);
- un **avatar** con niveles (**XP**), una moneda (**Hojas de mate**) y vidas (**HP**);
- **Desafíos** para no perder vidas y para recuperarlas, y **misiones secundarias** voluntarias.

El tono se adapta al **estado de ánimo** del usuario.

> *La constancia no significa avanzar siempre con la misma intensidad. Incluso un pequeño escalón representa progreso.*

### 1.1. Alcance de la Entrega 1 (30-nov-2026) — C-20 (actualizado en la segunda revisión)

La Entrega 1 es **la base de la app**. Debe poder: **iniciar sesión, crear hábitos y asignarlos a días, mostrar misiones secundarias, obtener recompensas por los hábitos y obtener desafíos por las vidas perdidas**.

| Prioridad | Contenido |
|---|---|
| **Imprescindible** | 1. **Login:** registro (usuario, correo, contraseña de mínimo 6 caracteres, aviso de privacidad), inicio de sesión con usuario o correo, cierre de sesión (sin borrar datos), onboarding mínimo (propósito y metas con categoría). |
| | 2. **Hábitos:** crear, editar y eliminar hábitos medibles con categoría, Hojas y XP; **asignarlos a días** en el Mapa; marcar cumplido o incumplido con deshacer de 10 s. |
| | 3. **HUD:** avatar fijo de marcador, nombre, nivel, barra de XP, 10 corazones, racha y Hojas. |
| | 4. **Recompensas por hábitos:** Hojas, XP y subida de nivel. |
| | 5. **Desafíos:** por incumplimiento (72 h; ½ Hojas + 20 % XP), pérdida de medio corazón al vencer y **desafío de recuperación por cada vida perdida**. |
| | 6. **Misiones secundarias:** modal con felicitación, categoría, sugerencia editable, 20 Hojas + 20 XP, máximo 3 al día. |
| | 7. **Mapa:** calendario con la programación y la trayectoria (clasificación por día). |
| | 8. **Cierre de jornada:** a las 04:00, Día Finalizado (con deshacer) y reconciliación. Es necesario para que los hábitos sin marcar queden incumplidos y el Mapa tenga historial. |
| **Si da tiempo** (en este orden) | Tienda de recompensas reales (canje, costo mínimo 20) · estado de ánimo + mini desafío + mensajes · Superdesafío y bloqueos a 0 HP (el HP nunca baja de 0 en ningún caso) · respaldo en el servidor · pulido pixel art basado en el logo · APK |
| **Fuera** | Cosméticos y creación del avatar · hábitos recomendados (P-04) y recompensas predefinidas (P-05) · recordatorios (P-47) · sincronización por operaciones (Fase 11) · varias ocurrencias de un hábito por día (P-43) · IA |

La app se entrega **funcional en Expo Go** (Android). Se procura que se vea bien, pero la prioridad es la lógica. Todo se diseña pensando en la expansión posterior.

## 2. Ciclo diario

1. El usuario se registra, define su **propósito** y sus **metas**, y crea su **avatar**.
2. Crea sus **hábitos** (cantidad, unidad, categoría, Hojas y XP) y los programa en el **Mapa**.
3. Al abrir la app ve un **mensaje** sobre su meta y su propósito y, debajo, el **selector de ánimo**.
4. Marca cada **misión del día** (hábito programado) como cumplida o incumplida. Tiene 10 s para deshacer.
5. **Cumplida:** recibe sus Hojas y su XP. **Incumplida:** recibe un desafío (normal, o mini si su último ánimo es bajo) con **72 h** de plazo.
6. Completar el desafío evita perder media vida y da **la mitad de las Hojas** y el **20 % de la XP**. Si vence, pierde **medio corazón** y recibe un **desafío de recuperación** para recuperarlo.
7. La jornada se cierra a las **04:00** o con **Día Finalizado**. Se calculan el porcentaje, la clasificación y la racha, y se muestra un mensaje.
8. Gasta Hojas en **recompensas reales** o en **cosméticos** (según su nivel).
9. Si llega a **0 HP**, la app se bloquea salvo el avatar y los desafíos. Puede hacer el **Superdesafío** (todas las vidas) o recuperar de a una unidad (lo que elimina el Superdesafío).

```text
Programar (Mapa) → Ánimo → Marcar ─┬─ cumplido ──▶ +Hojas +XP ──▶ nivel ──▶ cosméticos
                                   └─ incumplido ─▶ desafío 72 h (normal | mini)
                                                     ├─ completado ─▶ conserva HP + ½ Hojas
                                                     └─ vencido ────▶ −0.5 HP ─▶ (0 HP ⇒ bloqueo + Superdesafío)
Cierre (04:00 | Día Finalizado | reconciliación) → % → clasificación → racha → mensaje → respaldo
```

## 3. Glosario

| Término | Definición |
|---|---|
| **Jornada** | Día lógico: de 04:00 a 04:00 del día siguiente, en la hora del teléfono. |
| **Fecha de jornada** | Fecha a la que pertenece un registro, distinta de su hora real. |
| **Hábito** | Actividad medible (cantidad + unidad) con categoría y recompensas. |
| **Misiones del día** | Los hábitos programados en la jornada (C-26). |
| **Ocurrencia** | Instancia de un hábito en una jornada: pendiente, cumplida o incumplida. |
| **Hojas de mate** | Moneda virtual; sirve para recompensas reales y cosméticos. |
| **XP / Nivel** | Progreso; el nivel desbloquea cosméticos. Se empieza en nivel 0. |
| **HP** | Vidas: de 0 a 10 en pasos de 0.5, mostradas como diez corazones. |
| **Racha** | Jornadas Perfecto consecutivas (los días sin actividades se saltan). |
| **Desafío por incumplimiento** | Reto derivado de un hábito incumplido. Evita perder medio corazón y da ½ de las Hojas + 20 % de la XP. |
| **Mini desafío** | Variante pequeña del anterior cuando el último ánimo es bajo. |
| **Desafío de recuperación** | Devuelve HP ya perdido (P-12). |
| **Superdesafío** | Se activa a 0 HP: un reto por cada hábito activo, sin plazo. Devuelve 10 HP. |
| **Misión secundaria** | Reto voluntario extra (20 Hojas + 20 XP). |
| **Recompensa real** | Premio de la vida real que el usuario canjea con Hojas. |
| **Cosmético** | Accesorio pixel art del avatar para una ranura (cabeza, cara, cuello, pecho, manos, piernas, pies). |
| **Día Finalizado** | Botón para cerrar la jornada manualmente. |
| **Reconciliación** | Procesar, al abrir la app, los cierres y vencimientos que ocurrieron con ella cerrada. |
| **Respaldo** | Copia de los datos del usuario en el servidor (Entrega 1: instantánea). |

## 4. Variables del jugador

| Variable | Inicial | Se obtiene | Se pierde o gasta |
|---|---|---|---|
| Hojas de mate | 0 | Hábito cumplido (0–30, múltiplos de 5); desafío completado (½, hacia abajo); misión secundaria (20) | Recompensas reales y cosméticos |
| XP | 0 | Hábito cumplido (0–50, de 10 en 10); desafío completado (20 %); misión secundaria (20) | Nunca |
| Nivel | 0 | Derivado de la XP (total para el nivel *n* = `40·n² + 60·n`) | Nunca baja |
| HP | 20 unidades internas = 10 corazones | Desafío de recuperación (+1 unidad = medio corazón); Superdesafío (vuelve a 20) | −1 unidad (medio corazón) por desafío vencido |
| Racha | 0 | Jornada Perfecto | Jornada no Perfecto con actividades |

---

## 5. Registro, autenticación y configuración inicial

### 5.1. Primera apertura (RN-AUTH-01 a RN-AUTH-03)

1. Pantalla de bienvenida.
2. **Registro:** nombre de usuario (único), correo (único), contraseña (**mínimo 6 caracteres**) y aceptación del **aviso de privacidad** (C-25).
3. El servidor crea la cuenta.
4. **Propósito personal.**
5. **Metas:** texto libre + **categoría** (P-41, P-42).
6. **Avatar:** en la Entrega 1 se usa un avatar pixel art fijo. La creación y personalización llegan después (C-20, P-38).
7. Perfil inicial: **10 HP, 0 Hojas, 0 XP, nivel 0**.
8. Se guarda el token en el almacenamiento seguro y se entra a Home.

### 5.2. Aperturas posteriores

- Con una sesión válida: reconciliación → Home, con el mensaje de apertura y el selector de ánimo.
- **Inicio de sesión** con **nombre de usuario o correo** y contraseña (RN-AUTH-07).
- En un dispositivo sin datos, al iniciar sesión se **restaura el respaldo** del servidor.

### 5.3. Cerrar sesión y recuperar la contraseña

- **Cerrar sesión** respalda primero los datos. Si no hay conexión, avisa y **no borra** nada local (RN-AUTH-08).
- **¿Olvidaste tu contraseña?** muestra un enlace al **correo de soporte** del equipo [Abierta P-40, urgente; mientras tanto: "Escríbenos a soporte (próximamente)"]. El equipo restablece la contraseña a mano tras verificar la identidad.

---

## 6. Home y experiencia diaria

### 6.1. HUD (RN-NAV-02, RN-NAV-03)

Avatar (con lo equipado) · nombre · nivel · barra de XP · **diez corazones** (lleno, medio o vacío) · racha · saldo de Hojas. Se actualiza al instante.

### 6.2. Mensaje de apertura y ánimo

- Al abrir la app: un **mensaje motivacional que recuerda la meta y el propósito** y, **debajo**, el **selector de estado de ánimo**.
- El ánimo puede cambiarse **cuantas veces se quiera**. Siempre cuenta el **último** (C-28).

### 6.3. Acciones en Home

- Ver las **misiones del día** con su recompensa (Hojas y XP) y su cantidad ("60 minutos").
- **Marcar** cumplido o incumplido, con un botón **Deshacer** durante 10 s.
- Ver los **desafíos activos** con su **tiempo restante** (C-24).
- Cambiar el estado de ánimo.
- **Día Finalizado:** cierra la jornada y muestra el mensaje de cierre según el rendimiento y la meta. **Se puede deshacer hasta las 04:00**: los hábitos que el cierre marcó como incumplidos vuelven a estar pendientes y se eliminan sus desafíos.

---

## 7. Hábitos

### 7.1. Crear y editar (RN-HAB-01 a RN-HAB-09)

Cada hábito tiene:

| Campo | Regla |
|---|---|
| Nombre | Texto libre ("Estudiar programación"). |
| Categoría | Ejercicio · Estudio · Lectura · Arte y creatividad · Mindfulness · Salud y alimentación · Autocuidado · Hogar y orden · Finanzas personales · Relaciones y vida social · Trabajo y productividad · Espiritualidad · Bienestar digital · Ocio y hobbies · Voluntariado y comunidad · Otro. |
| Cantidad + unidad | Entero > 0 + unidad (minutos, páginas, repeticiones, km, vasos, veces u otra). |
| Hojas de mate | 0, 5, 10, 15, 20, 25 o 30. |
| XP | 0, 10, 20, 30, 40 o 50, presentados como dificultad (Fácil 10 · Media 20–30 · Difícil 40–50). |

- **Editar:** las jornadas futuras usan los valores nuevos, la de hoy conserva los suyos y las cerradas no cambian.
- **Eliminar:** deja de programarse y se borran sus ocurrencias futuras; la de hoy y el historial se conservan.
- Los hábitos recomendados llegan después de la entrega (P-04) y cumplen los mismos límites.

### 7.2. Programación (en el Mapa)

Días de la semana o fechas concretas. Una ocurrencia por hábito y jornada. Cambiar la programación solo afecta al futuro.

### 7.3. Registro

- Cumplido → Hojas + XP (una vez).
- Incumplido → desafío (§10).
- Pendiente al cierre → incumplido automáticamente.
- **Deshacer** en 10 s revierte el efecto. Después, el registro es definitivo.
- Solo con la jornada abierta y **HP > 0**.

### 7.4. Plazo de la jornada

Hasta las **04:00 del día siguiente**: lo marcado a las 02:30 del sábado pertenece al viernes.

---

## 8. Economía y progresión

### 8.1. Hojas de mate

Se ganan con hábitos (valor completo), desafíos completados (por incumplimiento o de recuperación: **½, redondeado hacia abajo**) y misiones secundarias (20). Se gastan en recompensas reales y cosméticos. Cada movimiento queda registrado y el saldo nunca es negativo.

### 8.2. XP y niveles

Se gana con hábitos (valor completo), desafíos completados (**20 %** de la XP del hábito) y misiones secundarias (20). Se empieza en nivel 0.

**Curva aprobada (P-03):** cada nivel cuesta 80 XP más que el anterior, empezando en 100 (nivel 1 = 100 XP · nivel 5 = 1.300 · nivel 10 = 4.600 · nivel 20 = 17.200). Es configurable y no tiene máximo.

### 8.3. HP

| Evento | HP |
|---|---|
| Desafío por incumplimiento vencido | −0.5 |
| Desafío de recuperación completado | +1 unidad (medio corazón) |
| Superdesafío completado | = 10 |
| A 0 HP, completar otro desafío | +1 unidad; el Superdesafío desaparece |

- Las pérdidas se acumulan.
- Nunca baja de 0 ni pasa de 10.
- Nunca se pierde HP al marcar un incumplimiento: solo al vencer su plazo.

---

## 9. Estado de ánimo y mensajes

### 9.1. Estados y efecto

| Estado (último registrado) | Desafío | Tono |
|---|---|---|
| Muy feliz / Bien | Normal | Propósito + aviso de la posible pérdida |
| Neutral / sin registrar | Normal | Neutral y respetuoso |
| Desanimado / Muy mal | **Mini** | Empático, sin culpabilizar |

- Si el ánimo cambia en la jornada, los desafíos **pendientes de esa jornada** se adaptan al nuevo estado, y el Mapa guarda el último.
- *Interpretación por confirmar:* al cerrarse la jornada, la variante queda fija.

### 9.2. Estados bajos (C-10)

Sin descuento inmediato · mensaje empático · reconoce que hay días difíciles · recuerda el propósito sin culpa · ofrece un **mini desafío** relacionado con el hábito, más pequeño y medible.

- Completarlo conserva el HP y da ½ de las Hojas.
- Si lo **rechaza**, puede pasarse al **desafío normal** o **deshacer el rechazo** mientras esté en plazo.
- Si al vencer no completó ninguno, pierde 0.5 HP.

**Ejemplo:** "Estudiar programación 60 min" + "Muy mal" → mini desafío "Estudiar programación 6 min" (10 %, [Propuesta P-07]). El equipo propuso "repasar un concepto 5 min" como idea del tamaño.

### 9.3. Mensajes (RN-MSG-01 a RN-MSG-05)

| Contexto | Contenido |
|---|---|
| Apertura de la app | Recuerda la meta y el propósito (selector de ánimo debajo). |
| Cierre de jornada | Según el rendimiento y la meta. |
| Al invocar un mini desafío | Empático, ánimo a dar el pequeño paso. |
| Al tocar un día anterior | Según el rendimiento de ese día. |

- Salen de un **JSON local amplio**, etiquetado por contexto, ánimo, rendimiento y categoría.
- **Contenido propio o con licencia que permita uso comercial.**
- La IA podrá llegar más adelante, como mejora opcional.

---

## 10. Desafíos y misiones secundarias

### 10.1. Desafío por incumplimiento (normal o mini)

- **Uno** por ocurrencia incumplida, vinculado a su hábito. Muestra la acción, el criterio medible y la **cuenta atrás**.
- **Tamaño (P-07):** el normal es el 50 % de la cantidad del hábito y el mini el 10 % (mínimo 1).
- **Plazo: 72 h** desde su creación, sea el incumplimiento manual o automático.
  - Si venció con la app cerrada, al abrirla hay **12 h de gracia**, una sola vez.
- **Completar:** por **autodeclaración** del criterio. Da ½ de las Hojas (hacia abajo) y el 20 % de la XP del hábito, y no cambia el porcentaje del día.
- No se puede completar fuera de plazo.

### 10.2. Recuperación de HP (P-12)

- Internamente hay **20 vidas** (unidades); el usuario ve **10 corazones**. Cada vida perdida equivale a medio corazón.
- **Cada vida perdida** genera un **desafío de recuperación** del mismo hábito, de tamaño normal y **sin plazo**.
- Completarlo devuelve **1 vida (medio corazón)** y da ½ de las Hojas + el 20 % de la XP del hábito.
- No hay límite diario: hay como mucho un desafío de recuperación por cada vida perdida.

### 10.3. Superdesafío (RN-DES-13)

- Se activa al llegar a **0 HP**.
- Contiene **un reto por cada hábito activo** (de tamaño normal), sin plazo, para que el usuario vuelva cuando quiera.
- Al completar todos los retos: **10 HP**.
- Si, estando a 0 HP, el usuario completa otro desafío, recupera 1 unidad y **el Superdesafío desaparece**.

### 10.4. A 0 HP (RN-NAV-04)

| Bloqueado | Permitido |
|---|---|
| Programar en el Mapa, marcar hábitos, comprar y canjear en la Tienda, misiones secundarias | Personalizar el avatar (equipar lo comprado), Superdesafío, desafíos que devuelven HP, consultar en solo lectura (*interpretación*) |

- Lo bloqueado aparece deshabilitado y explica por qué.
- Las jornadas que transcurren a 0 HP quedan **"En pausa"**: no cuentan en el porcentaje, no generan desafíos y se saltan en la racha (P-50).

### 10.5. Misiones secundarias (RN-MIS-01 a RN-MIS-05)

1. En **Desafíos**, un botón abre un modal que **felicita** al usuario por querer ir más allá de lo programado.
2. El usuario **elige una categoría**.
3. Recompensa fija: **20 Hojas + 20 XP**, mostrada antes de aceptar y acreditada una sola vez.

- **Personalización:** la app sugiere una misión medible según sus metas y hábitos de esa categoría, y el usuario puede **modificarla** o escribir la suya.
- **Máximo 3 misiones por jornada** (C-31).
- Bloqueadas a 0 HP.

---

## 11. Mapa

### 11.1. Calendario y trayectoria

- Cada día muestra su **clasificación** con color e icono o texto.
- Al tocar un día anterior se ven su resumen, el **último estado de ánimo** y un **mensaje según su rendimiento**.

| Clasificación | Cumplimiento (sin redondear) |
|---|---:|
| Perfecto | 100 % |
| Muy bueno | 85–99 % |
| Parcial | 40–84 % (84,6 % es Parcial) |
| Crítico | < 40 % |
| Sin actividades programadas | 0 hábitos programados (se salta en la racha) |

Porcentaje = cumplidos / programados × 100. Los desafíos no cuentan.

### 11.2. Programación

Una tabla bajo el calendario permite elegir los días o fechas de cada hábito. Bloqueada a 0 HP.

---

## 12. Tienda y avatar

### 12.1. Recompensas reales

El usuario crea las suyas (nombre + costo de **mínimo 20 Hojas**, sin máximo) y las canjea **cuantas veces quiera**, validando el saldo. Cada canje queda registrado. Las predefinidas llegan después de la entrega (P-05).

### 12.2. Cosméticos

- **Ranuras:**
  - cabeza (gorras, sombreros);
  - cara (gafas, pañoleta, piercings);
  - cuello (cadenas, pañoleta);
  - pecho (camisetas, chaquetas, buzos);
  - manos (guantes, reloj, anillos);
  - piernas (pantalón, pantaloneta);
  - pies (zapatos, chanclas).
- Se compran con Hojas si el nivel es suficiente. Equiparlos es gratis, uno por ranura (*interpretación*).
- **No entran en la Entrega 1.** Primer catálogo (P-16): Gorra (cabeza, nivel 1, 30 Hojas) · Cadena (cuello, nivel 2, 35) · Gafas (cara, nivel 2, 40) · Hoodie (pecho, nivel 3, 50).

### 12.3. Avatar

En la Entrega 1 es un **avatar pixel art fijo** de marcador. La creación y personalización llegan después. El estilo se basa en el **logo** y los bocetos del equipo (C-22, P-38). Refleja lo equipado y aparece en el HUD.

---

## 13. Navegación

| Sección | Contenido |
|---|---|
| **Home** | Mensaje y ánimo, misiones del día, desafíos activos con su cuenta atrás, Día Finalizado. |
| **Mapa** | Calendario, trayectoria, programación de hábitos. |
| **Tienda** | Recompensas reales y cosméticos (comprar y equipar). |
| **Desafíos** | Desafíos por incumplimiento, recuperación, Superdesafío y misiones secundarias. |

Fuera de las pestañas están bienvenida, registro, inicio de sesión, propósito y metas, avatar y gestión de hábitos. El HUD siempre está visible.

## 14. Cierre de jornada

- **Automático a las 04:00**, **manual con Día Finalizado** o **por reconciliación** al abrir la app.
- **Pasos:** programados → cumplidos → pendientes a incumplidos → desafíos → vencimientos (72 h + gracia) → pérdidas de HP → porcentaje → clasificación → racha → mensaje → **respaldo**.
- Es **idempotente**, y las jornadas vencidas se procesan en orden.
- **Recordatorio** de 18:00 a 20:00 si hay hábitos pendientes: llega después de la entrega (P-47).

## 15. Persistencia y respaldo

- Local primero: la app funciona sin conexión con sus datos.
- **Un dispositivo por cuenta** en la v1.
- **Entrega 1:** al cerrar cada jornada y antes de cerrar sesión, la app sube una **instantánea** de los datos al servidor, y la restaura al iniciar sesión.
- La validación de cada operación en el servidor llega en la Fase 11 (CT-21).
- La interfaz indica discretamente si hay cambios sin respaldar.

## 16. Fuera de alcance o no definido

- IA generativa (solo como mejora futura).
- Correo automático de recuperación de contraseña.
- Varios dispositivos por cuenta.
- Notificaciones push desde el servidor.
- iOS.
- Funciones sociales o compras con dinero real.
- Cualquier punto marcado como **Abierta**.

## 17. Mejoras futuras registradas

| Mejora | Origen |
|---|---|
| Varias ocurrencias de un hábito por día ("beber agua ×3") | P-43 |
| Mensajes personalizados con IA | C-15 |
| Migración a Supabase con servidor propio | P-51 |
| Más cosméticos y arte pixel art definitivo | C-22 |
| Hábitos recomendados y recompensas predefinidas | P-04, P-05 |
| Sincronización por operaciones y varios dispositivos | Fase 11 |

## 18. Trazabilidad con el documento original

| Doc § | Esta especificación |
|---|---|
| 1–2 | §1, §2, §4 |
| 3, 14, 15 | §15 y `ARCHITECTURE.md` |
| 4 | §5 |
| 5 | §6 |
| 6 | §7 (actualizado: CT-18, CT-19, CT-20) |
| 7 | §4, §8 |
| 8 | §9 (CT-03, CT-09) |
| 9 | §10 (CT-12 a CT-16) |
| 10 | §11 |
| 11 | §12 |
| 12 | §14 |
| 13 | §13 |
| 16 | `BUSINESS_RULES.md` §19 |
| 17 | `DECISIONS.md` §3 |

## 19. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.1 | 2026-11-25 | Derivada del Doc v1.0 con las actualizaciones de la Fase 0. |
| 1.3 | 2026-11-25 | Segunda revisión: alcance mínimo de la Entrega 1 (sin cosméticos ni creación de avatar); desafíos con ½ Hojas + 20 % de XP; recuperación definida; curva de niveles; 16 categorías; 3 misiones al día, editables; recompensa real ≥ 20; deshacer Día Finalizado; contraseña de mínimo 6 caracteres. |
| 1.2 | 2026-11-25 | Respuestas de la revisión de la Fase 0: alcance de la Entrega 1, Android, pixel art, hábitos medibles con categoría, plazo de 72 h + gracia, recompensa de los desafíos, ánimo cambiante, 0 HP, Superdesafío, misiones, deshacer y respaldo. |
