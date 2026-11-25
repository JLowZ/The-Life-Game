TECHPHIC  |  THE LIFE GAME 

# **THE LIFE GAME** 

Documento explicativo del funcionamiento de la aplicación 

_Especificación funcional y descripción de la lógica interna_ 

Equipo: TechPhic 

Integrantes: Juan José López, David Pachón y Dylan Arredondo 

Tecnología de aplicación: React Native 

Versión del documento: 1.0  |  13 de noviembre de 2026 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

## **Control del documento** 

|**Elemento**|**Descripción**|
|---|---|
|Producto|The Life Game|
|Equipo|TechPhic|
|Propósito|Explicar de manera descriptiva y detallada cómo opera la<br>aplicación desde la perspectiva del usuario y cómo debe<br>responder internamente el sistema.|
|Plataforma|Aplicación móvil desarrollada con React Native.|
|Arquitectura prevista|Híbrida: persistencia local y sincronización con un servidor.|
|Estado|Documento base para orientar el análisis, diseño e<br>implementación. Las decisiones aún no definidas se identifican<br>expresamente.|



## **Contenido** 

- 1. Introducción y propósito del producto 

- 2. Concepto general y principios de funcionamiento 

- 3. Arquitectura de la aplicación 

- 4. Registro, autenticación y primera configuración 

- 5. Inicio y experiencia diaria 

- 6. Sistema de hábitos 

- 7. Economía y progresión: Hojas de mate, XP y HP 

- 8. Estado de ánimo y mensajes motivacionales 

- 9. Desafíos, recuperación y misiones secundarias 

- 10. Mapa: calendario y programación 

- 11. Tienda y personalización del avatar 

- 12. Cierre y procesamiento de la jornada 

- 13. Navegación y estructura de pantallas 

- 14. Persistencia, sincronización y datos 

- 15. Lógica interna recomendada en React Native 

- 16. Reglas de negocio consolidadas 

- 17. Aspectos pendientes de definición 

## **1. Introducción y propósito del producto** 

The Life Game es una aplicación móvil de gestión de hábitos que incorpora mecánicas propias de los videojuegos de rol (RPG). Su finalidad es ayudar al usuario a organizar actividades personales, mantener constancia y visualizar su progreso mediante un sistema de hábitos, calendario gamificado, personaje, niveles, moneda virtual, vidas y desafíos. 

La aplicación transforma las actividades cotidianas en objetivos que pueden programarse y completarse. Cada hábito realizado contribuye al progreso del jugador; cada incumplimiento activa una consecuencia y un desafío relacionado con la actividad pendiente. El sistema busca combinar motivación, seguimiento y responsabilidad personal. 

La aplicación será desarrollada con React Native. Su arquitectura será híbrida: procurará guardar localmente la información que se consulta o modifica con frecuencia y utilizará un servidor para autenticación y respaldo/sincronización de información relevante. La tecnología concreta del servidor todavía no está definida. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

## **2. Concepto general y principios de funcionamiento** 

El usuario crea una cuenta, define un propósito personal y sus metas, configura un avatar y registra los hábitos que desea trabajar. Desde Home consulta las actividades previstas para la jornada, registra su estado de ánimo y marca manualmente el resultado de cada hábito. 

El sistema calcula el avance diario, entrega Hojas de mate y XP por los hábitos cumplidos, y administra HP cuando se producen incumplimientos. Si un hábito no se cumple, se genera un desafío asociado a ese hábito. El usuario puede completar el desafío dentro del plazo establecido para evitar la pérdida de HP. 

La jornada se puede cerrar manualmente o se procesa automáticamente al llegar a las 4:00 a. m. La aplicación presenta mensajes motivacionales relacionados con el propósito del usuario, su estado de ánimo y su rendimiento. 

### **2.1. Variables principales del jugador** 

|**Variable**|**Función**|**Regla conocida**|
|---|---|---|
|Hojas de mate|Moneda virtual de intercambio.|Se obtienen al cumplir hábitos y se gastan<br>al canjear recompensas o cosméticos.|
|XP|Experiencia acumulada para progresar de<br>nivel.|Se obtiene al cumplir hábitos y mediante<br>misiones secundarias. La tabla de niveles<br>está pendiente.|
|HP|Reserva de vidas del jugador.|Máximo de 10 vidas. Cada<br>incumplimiento puede descontar 1/2<br>vida. Se recupera mediante desafíos.|



Para representar las medias vidas de forma fiable, se recomienda almacenar HP en unidades enteras de media vida: 20 unidades equivalen a 10 HP; una pérdida o recuperación de media vida modifica el valor en una unidad. Así se evitan errores de cálculo asociados a números decimales. 

## **3. Arquitectura de la aplicación** 

The Life Game utilizará una arquitectura híbrida. React Native gestionará la interfaz, la navegación, las interacciones y las reglas que deban ejecutarse en el dispositivo. El almacenamiento local permitirá consultar y actualizar datos sin realizar una petición al servidor en cada interacción. El servidor conservará la información necesaria para autenticar al usuario y mantener un respaldo sincronizado. 

### **3.1. Funcionamiento de alto nivel** 

1. El usuario interactúa con una pantalla de React Native. 

2. La aplicación valida la acción y ejecuta las reglas de negocio correspondientes. 

3. Los cambios se guardan primero en el almacenamiento local para mantener una respuesta rápida. 

4. Cuando exista conexión, la aplicación sincroniza con el servidor los datos que deban respaldarse. 

5. Si no hay conexión, los cambios permanecen en una cola local y se intentan sincronizar posteriormente. 

La sincronización debe contemplar conflictos, reintentos y prevención de duplicados. Por ejemplo, una misma recompensa o un mismo hábito no debe acreditarse dos veces porque una petición se haya repetido. 

### **3.2. Tecnología local recomendada** 

Como recomendación inicial, se propone SQLite mediante una biblioteca compatible con React Native para almacenar datos estructurados: hábitos, programación, resultados diarios, desafíos, transacciones de Hojas de mate, XP, HP y progreso del avatar. SQLite es más apropiado que AsyncStorage como repositorio principal porque permite consultas relacionadas, filtros por fecha y transacciones. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

AsyncStorage puede reservarse para preferencias sencillas, como ajustes de interfaz o indicadores no críticos. No se recomienda utilizarlo como única base de datos del juego. 

La selección definitiva de bibliotecas deberá validarse cuando se defina si el proyecto utilizará Expo o React Native CLI y según las versiones compatibles del entorno. 

### **3.3. Responsabilidades del servidor** 

El servidor se utilizará para gestionar el registro y la autenticación, así como para respaldar y sincronizar la información relevante del usuario. La tecnología de backend, la base de datos, la API y las políticas exactas de sincronización todavía no están definidas. Por tanto, este documento no presupone Node.js, PHP, MySQL ni un proveedor específico. 

## **4. Registro, autenticación y primera configuración** 

La primera vez que una persona abre la aplicación se presenta la pantalla de bienvenida y el acceso al registro o inicio de sesión. El registro solicita nombre de usuario, correo electrónico y contraseña. Durante la configuración inicial también se solicita el propósito personal y las metas del usuario, ya que estos datos sirven para contextualizar los mensajes motivacionales. 

### **4.1. Flujo de primera apertura** 

6. La aplicación muestra la pantalla de bienvenida. 

7. El usuario selecciona registrarse y completa nombre de usuario, correo y contraseña. 

8. El sistema valida los campos y crea la cuenta mediante el servicio de autenticación del servidor. 

9. El usuario registra su propósito personal y sus metas. 

10. El usuario crea y personaliza su avatar. 

11. La aplicación inicializa el perfil del jugador, incluyendo 10 HP, nivel inicial y saldos iniciales de Hojas de mate y XP según los valores que se definan para el lanzamiento. 

12. Se guarda localmente la sesión y la información necesaria para la experiencia cotidiana. 

13. El usuario llega a Home. 

Los saldos iniciales de Hojas de mate y XP, así como el nivel inicial, deberán fijarse antes de la implementación. No se deben asumir cantidades gratuitas si el equipo no las ha definido. 

### **4.2. Aperturas posteriores** 

Después del primer acceso, la aplicación conserva la sesión del usuario de forma segura. En las siguientes aperturas, si la sesión sigue siendo válida, no vuelve a mostrar el onboarding ni solicita iniciar sesión: dirige al usuario a Home y presenta el mensaje diario de rendimiento y estado de ánimo. Si el usuario cierra sesión voluntariamente o la sesión deja de ser válida, se muestra nuevamente el flujo de autenticación. 

La contraseña no debe almacenarse en texto plano. Los tokens o credenciales de sesión deben guardarse mediante almacenamiento seguro del sistema operativo, no en una tabla ordinaria de preferencias. 

## **5. Inicio y experiencia diaria** 

Home es la pantalla principal y el punto de entrada habitual después de la autenticación inicial. Presenta los hábitos programados para el día, el estado del jugador y el acceso a las demás secciones. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

### **5.1. Player HUD** 

En la parte superior se mantiene un panel de estado (HUD) inspirado en interfaces de videojuegos. Este panel muestra el avatar, nombre del usuario, nivel, barra de XP, cantidad de HP representada visualmente y racha de días perfectos. También puede mostrar el saldo de Hojas de mate. 

El HUD debe actualizarse cuando cambien las variables del jugador. Por ejemplo, al completar un hábito se actualizan las Hojas de mate y XP; al procesar un incumplimiento se actualizan los HP. 

### **5.2. Mensaje de entrada** 

Al abrir Home, la aplicación presenta un mensaje motivacional relacionado con el propósito personal y las metas registradas. También solicita o permite seleccionar el estado de ánimo del día. El mensaje de rendimiento se basa en los resultados de la jornada que se acaba de procesar o en el último día cerrado. 

En una primera versión, los mensajes se seleccionarán desde un diccionario amplio de textos predefinidos, clasificados por propósito, meta, estado de ánimo y rendimiento. En una versión posterior podría incorporarse inteligencia artificial para producir mensajes más personalizados. La IA no se considera una dependencia necesaria para el funcionamiento inicial. 

### **5.3. Acciones en Home** 

- Consultar los hábitos programados para la jornada. 

- Marcar manualmente cada hábito como cumplido o incumplido. 

- Consultar la recompensa de Hojas de mate y XP asociada a cada hábito. 

- Consultar desafíos activos derivados de incumplimientos. 

- Registrar o actualizar el estado de ánimo. 

- Cerrar manualmente la jornada, si el usuario desea hacerlo antes del corte automático. 

## **6. Sistema de hábitos** 

Los hábitos son las actividades que el usuario desea incorporar a su rutina. La aplicación ofrece hábitos recomendados definidos por el equipo y permite crear hábitos personalizados. Los recomendados pueden seleccionarse o ignorarse; los personalizados pueden crearse, editarse y eliminarse. 

### **6.1. Hábitos recomendados** 

Los hábitos predefinidos tienen asignadas por el equipo las cantidades de Hojas de mate y XP que entregan al completarse. El usuario puede elegir cuáles incorporar a su calendario. Los valores exactos se administran en el catálogo de hábitos. 

### **6.2. Hábitos personalizados** 

Al crear un hábito propio, el usuario define su nombre y los valores de recompensa. La cantidad de Hojas de mate tiene un máximo de 30 por hábito y la cantidad de XP un máximo de 50 por hábito. Los mínimos y la posibilidad de asignar cero en alguno de los dos valores deben definirse en las validaciones del formulario. 

La edición de un hábito debe afectar su configuración futura. Para conservar la integridad del historial, se recomienda que los cambios no modifiquen retroactivamente los valores de recompensas de instancias ya programadas o completadas. De igual manera, eliminar un hábito debería impedir nuevas programaciones sin borrar el historial pasado. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

### **6.3. Programación en el Mapa** 

El usuario elige libremente los días en los que desea realizar cada hábito. Por ejemplo, puede programar ejercicio los lunes, miércoles y viernes y lectura los martes y jueves. La aplicación crea una ocurrencia del hábito para cada fecha seleccionada. 

### **6.4. Registro de cumplimiento** 

El usuario debe marcar manualmente cada hábito como cumplido o incumplido. Si lo marca como cumplido dentro del plazo, la aplicación registra el resultado y acredita las Hojas de mate y XP correspondientes. Si lo marca como incumplido, se activa el proceso de desafío asociado. 

Si llega la hora límite y el usuario no ha registrado un resultado, el sistema considera el hábito incumplido automáticamente. De esta manera, olvidar marcar una actividad no evita la aplicación de las reglas del juego. 

### **6.5. Plazo de cumplimiento** 

La hora límite de la jornada es las 4:00 a. m. del día siguiente. Por ejemplo, los hábitos programados para el viernes 13 pueden registrarse hasta las 4:00 a. m. del sábado 14. En ese momento se procesan los hábitos que continúen pendientes. 

La aplicación debe diferenciar la fecha a la que pertenece el hábito de la fecha y hora real en la que se procesa. Esto permite que las actividades realizadas después de medianoche, pero antes de las 4:00 a. m., sigan perteneciendo a la jornada anterior. 

## **7. Economía y progresión: Hojas de mate, XP y HP** 

### **7.1. Hojas de mate** 

Las Hojas de mate son la moneda virtual de The Life Game. Se obtienen principalmente al completar hábitos y se utilizan para canjear recompensas de la vida real y elementos cosméticos. El saldo aumenta cuando se acredita una recompensa y disminuye cuando se confirma un canje. 

Las Hojas de mate no son equivalentes a XP ni a HP. Gastar Hojas de mate no debe reducir la experiencia ni las vidas del jugador. 

### **7.2. Experiencia (XP) y niveles** 

La XP representa el progreso acumulado del jugador. Se obtiene al completar hábitos y mediante misiones secundarias. Al alcanzar los umbrales de experiencia establecidos, el sistema incrementa el nivel del usuario y puede habilitar cosméticos u otros elementos. 

La fórmula de progresión y la cantidad de XP necesaria para cada nivel están pendientes de definición. La aplicación debe mantener estos valores en una configuración que pueda ajustarse sin reescribir toda la lógica del sistema. 

### **7.3. Puntos de vida (HP)** 

El jugador dispone de un máximo de 10 HP. Para representar pérdidas y recuperaciones de media vida, el sistema debe manejar internamente 20 unidades de media vida. El HUD puede representar visualmente las unidades como diez corazones, cada uno con estado completo o medio. 

|**Evento**|**Variación de HP**|**Variación interna recomendada**|
|---|---|---|
|Incumplir un hábito|−1/2 HP|−1 unidad|
|Completar un desafío de recuperación|+1/2 HP|+1 unidad|
|Completar el superdesafío|Recupera hasta 10 HP|Establece el valor en 20 unidades|



Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

Límite máximo 10 HP 20 unidades 

Cada hábito incumplido puede descontar media vida. Por tanto, tres hábitos incumplidos representan una pérdida total de 1,5 HP; seis hábitos incumplidos representan una pérdida de 3 HP. La aplicación no debe limitar la pérdida a una sola unidad por día. 

El sistema nunca debe permitir que el saldo supere 10 HP. Las recuperaciones se limitan al máximo disponible. 

## **8. Estado de ánimo y mensajes motivacionales** 

El usuario puede registrar su estado de ánimo desde Home. Los estados iniciales propuestos son: muy feliz, bien, neutral, desanimado y muy mal. El registro permite contextualizar la experiencia y seleccionar mensajes de apoyo. 

El estado emocional no cambia por sí solo las cantidades de Hojas de mate, XP o HP. Las consecuencias del incumplimiento se rigen por las reglas de hábitos y desafíos. El estado de ánimo sirve para adaptar el mensaje, el tono y la experiencia de acompañamiento. 

Cuando el usuario registra un estado bueno o positivo y marca manualmente un hábito como incumplido, la aplicación muestra un recordatorio relacionado con su propósito personal, indicando que mantener el incumplimiento puede ocasionar una pérdida de media vida si no completa el desafío correspondiente. 

Cuando el estado de ánimo es bajo, la aplicación debe utilizar mensajes más empáticos y de apoyo. La regla acordada es que cada hábito incumplido genere un desafío asociado a ese hábito; el estado emocional no elimina automáticamente esa regla. 

Los mensajes se seleccionan inicialmente de un diccionario local amplio. Cada mensaje puede etiquetarse por estado emocional, propósito, tipo de meta, rendimiento y contexto (bienvenida, cumplimiento, incumplimiento, cierre diario o recuperación). 

## **9. Desafíos, recuperación y misiones secundarias** 

La sección se denomina Desafíos. Se evita el término castigo porque el propósito es presentar las consecuencias como acciones concretas para retomar el hábito, no como una sanción emocional. 

### **9.1. Desafío asociado a un hábito incumplido** 

Cada hábito incumplido genera un desafío relacionado con la actividad que no se realizó. La aplicación debe asociar el desafío con el hábito de origen para que el usuario entienda qué conducta busca recuperar. 

|**Hábito incumplido**|**Ejemplo de desafío asociado**|
|---|---|
|Ejercicio|Realizar una actividad física definida, por ejemplo una serie de<br>flexiones.|
|Lectura|Leer una cantidad determinada de páginas.|
|Estudio|Completar una actividad breve de repaso del tema programado.|



Los ejemplos anteriores ilustran la relación entre hábito y desafío; el catálogo definitivo, su dificultad y sus criterios de finalización deberán ser configurados por el equipo. El usuario debe poder identificar qué desafío tiene pendiente y qué acción debe completar. 

Cuando el usuario marca manualmente un hábito como incumplido, el desafío se genera en ese momento. Si no marca el hábito, el sistema lo registra como incumplido al llegar a las 4:00 a. m. y genera entonces el desafío correspondiente. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

El desafío tiene como finalidad permitir que el usuario evite la pérdida de media vida. La regla temporal descrita por el equipo establece un plazo hasta las 4:00 a. m. siguiente para completar el desafío. Si no se completa dentro del plazo, se descuenta 1/2 HP. 

### **9.2. Recuperación de HP** 

La sección Desafíos también permite recuperar vidas. Un desafío de recuperación completado devuelve 1/2 HP, sin superar el máximo de 10 HP. Los desafíos de recuperación deben distinguirse de los desafíos generados por un hábito incumplido: los primeros recuperan vida perdida; los segundos permiten evitar una pérdida pendiente. 

### **9.3. Superdesafío** 

Cuando el jugador llega a 0 HP, se activa un Superdesafío. Su finalidad es recuperar la totalidad de las vidas y permitir que el jugador vuelva a utilizar el sistema. La intención definida es que, con 0 HP, el sistema restrinja el registro de nuevas actividades hasta que el usuario complete el Superdesafío o el mecanismo de recuperación que el equipo autorice. 

La regla exacta de acceso a pantallas con 0 HP requiere una decisión de implementación: se recomienda permitir el acceso a la sección Desafíos y a la información necesaria para completar el Superdesafío, mientras se bloquean las acciones de registro de nuevos hábitos o resultados que el equipo decida restringir. 

### **9.4. Misiones secundarias** 

Las misiones secundarias son actividades voluntarias que el usuario puede aceptar por iniciativa propia para obtener Hojas de mate y XP adicionales. No se originan necesariamente en un incumplimiento. Su aceptación debe ser explícita y sus recompensas deben mostrarse antes de iniciar la misión. 

Los valores de recompensa, condiciones de finalización y límites de misiones simultáneas todavía deben configurarse. 

## **10. Mapa: calendario y programación** 

El Mapa es la representación gamificada del calendario. Visualmente se inspira en un mapa de niveles de un videojuego, pero funcionalmente mantiene las capacidades de un calendario: permite consultar jornadas pasadas y programar hábitos para fechas futuras. 

### **10.1. Calendario de rendimiento** 

Cada día se representa mediante una casilla o nivel. El color y el indicador visual reflejan el porcentaje de hábitos cumplidos. Al seleccionar un día anterior, se presenta un mensaje correspondiente al rendimiento registrado y se puede consultar el resumen de esa jornada. 

|**Clasificación**|**Porcentaje de cumplimiento**|
|---|---|
|Perfecto|100 %|
|Muy bueno|85 % a 99 %|
|Parcial|40 % a 84 %|
|Crítico|Menos del 40 %|



El porcentaje se calcula mediante la cantidad de hábitos cumplidos dividida por la cantidad de hábitos programados para ese día, multiplicada por 100. Cada hábito cuenta con el mismo peso para esta clasificación, independientemente de sus Hojas de mate o XP. 

Si una jornada no tiene hábitos programados, no debe clasificarse automáticamente como perfecta. Se recomienda mostrarla como día sin actividades programadas o sin datos de cumplimiento. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

### **10.2. Tabla de programación** 

Debajo del calendario se presenta una tabla con los hábitos del usuario y controles para seleccionar los días en los que desea realizarlos. La selección es libre y permite crear rutinas diferentes según la actividad. 

Al modificar la programación, el sistema crea, actualiza o elimina ocurrencias futuras. Los registros históricos no deben modificarse por cambiar la programación actual. 

## **11. Tienda y personalización del avatar** 

La tienda contiene dos categorías: recompensas de la vida real y cosméticos del avatar. 

### **11.1. Recompensas de la vida real** 

La aplicación incluye recompensas predefinidas y permite que cada usuario cree recompensas personalizadas. El usuario define el nombre y el costo en Hojas de mate, sin un límite máximo establecido por las reglas actuales. 

Al confirmar un canje, el sistema valida que el usuario tenga saldo suficiente y descuenta las Hojas de mate correspondientes. La transacción debe registrarse en el historial para que el saldo pueda auditarse y no se duplique una compra. 

El canje representa el compromiso personal del usuario de realizar la recompensa en la vida real; la aplicación administra el saldo y el registro del intercambio. 

### **11.2. Cosméticos y armario** 

El armario permite desbloquear y equipar accesorios como gorras, gafas, ropa y fondos. Los cosméticos se desbloquean al alcanzar determinados niveles y se adquieren utilizando Hojas de mate. Por tanto, el nivel habilita el acceso al artículo y la moneda permite canjearlo. 

Una vez adquirido, el cosmético queda disponible en el inventario del usuario y puede equiparse o cambiarse. Los artículos comprados no deberían volver a descontar moneda al ser equipados. 

La apariencia del avatar debe reflejar los elementos equipados y el nivel alcanzado. El avatar aparece en el HUD y en las secciones donde se muestre la identidad del jugador. 

## **12. Cierre y procesamiento de la jornada** 

El usuario puede cerrar manualmente el día mediante el botón Día Finalizado. Al hacerlo, la aplicación procesa los hábitos pendientes de esa jornada y presenta un mensaje motivacional acorde con el rendimiento y el estado de ánimo registrado. 

Si el usuario no cierra manualmente el día, el sistema realiza el procesamiento al llegar a las 4:00 a. m. del día siguiente. Por ejemplo, la jornada del viernes 13 se cierra automáticamente el sábado 14 a las 4:00 a. m. 

### **12.1. Comportamiento al cerrar** 

14. Identificar los hábitos programados para la jornada que se está cerrando. 

15. Conservar como cumplidos los hábitos que el usuario marcó correctamente. 

16. Identificar los hábitos pendientes y registrarlos como incumplidos. 

17. Generar un desafío asociado a cada hábito incumplido, si todavía no existe. 

18. Aplicar las reglas de vencimiento y pérdida de HP que correspondan. 

19. Calcular el porcentaje de cumplimiento y clasificar el día. 

20. Guardar el resumen diario y actualizar la racha de días perfectos cuando corresponda. 

21. Mostrar el mensaje motivacional de cierre. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

El cierre debe ser idempotente: ejecutarlo manualmente y luego volver a procesarlo por una tarea automática no debe duplicar recompensas, desafíos ni pérdidas de HP. 

La aplicación también puede permitir que el usuario no cierre manualmente un hábito y mostrar un recordatorio de que sigue pendiente. Si no se resuelve antes de la hora límite, se aplica la regla de incumplimiento y se genera el desafío. 

## **13. Navegación y estructura de pantallas** 

La navegación principal se organiza en pestañas inferiores, manteniendo el acceso al HUD superior. 

|**Sección**|**Responsabilidad principal**|
|---|---|
|Home|Consultar hábitos del día, registrar cumplimiento, estado de<br>ánimo y revisar mensajes.|
|Mapa|Consultar el calendario de rendimiento y programar hábitos en<br>fechas futuras.|
|Tienda|Canjear recompensas de la vida real y cosméticos mediante<br>Hojas de mate.|
|Desafíos|Resolver desafíos por incumplimiento, recuperar HP, realizar el<br>Superdesafío y aceptar misiones secundarias.|



La navegación debe reflejar el estado del jugador. Si el usuario llega a 0 HP, las acciones restringidas deben bloquearse de forma coherente, pero la sección necesaria para resolver el Superdesafío debe permanecer accesible. 

## **14. Persistencia, sincronización y datos** 

La persistencia local es la primera capa de almacenamiento para los datos de uso frecuente. El servidor actúa como respaldo y punto de sincronización. El objetivo es reducir solicitudes innecesarias y mantener una experiencia fluida. 

### **14.1. Datos que conviene guardar localmente** 

- Perfil de usuario y preferencias necesarias para la interfaz. 

- Hábitos, catálogo descargado y programación por fechas. 

- Resultados diarios y estados de cumplimiento. 

- Estado de ánimo y mensajes ya seleccionados, cuando corresponda. 

- Saldo y movimientos de Hojas de mate, XP y HP. 

- Nivel, racha y progreso del avatar. 

- Desafíos activos, desafíos completados y misiones secundarias. 

- Inventario y cosméticos equipados. 

- Cola de cambios pendientes de sincronización. 

### **14.2. Datos que deben respaldarse en servidor** 

Como mínimo, el servidor debe gestionar la cuenta y conservar un respaldo de los datos necesarios para recuperar el progreso en otro dispositivo. El equipo deberá decidir qué datos se sincronizan inmediatamente, cuáles se agrupan y qué información permanece exclusivamente local. 

Los cambios de saldo y las transacciones que afectan Hojas de mate, XP y HP deben diseñarse con especial cuidado. Para evitar manipulación o duplicación, las operaciones críticas deberían validarse también en el servidor cuando la API esté disponible. 

Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

### **14.3. Uso sin conexión** 

La aplicación debe poder consultar y modificar localmente la información que ya esté disponible. Cuando no exista conexión, registra los cambios pendientes y los sincroniza cuando se restablezca el acceso al servidor. La interfaz debe informar de manera discreta si existen cambios pendientes o si la sincronización ha fallado. 

La política de resolución de conflictos —por ejemplo, cuando una misma cuenta modifica datos desde dos dispositivos— está pendiente de definición. 

## **15. Lógica interna recomendada en React Native** 

La implementación debe separar la interfaz visual de las reglas del juego y del acceso a datos. Esto facilita probar las reglas, mantener el código y cambiar el servidor o el almacenamiento sin reconstruir todas las pantallas. 

### **15.1. Capas recomendadas** 

|**Capa**|**Responsabilidad**|
|---|---|
|Presentación|Pantallas, componentes, formularios, HUD, calendario, tienda y<br>navegación.|
|Estado de aplicación|Mantener el estado visible del usuario y coordinar<br>actualizaciones entre pantallas.|
|Servicios / casos de uso|Ejecutar acciones: completar hábito, crear desafío, cerrar día,<br>canjear recompensa y sincronizar.|
|Dominio / reglas de negocio|Validar límites, calcular recompensas, HP, XP, porcentajes,<br>plazos y estados.|
|Persistencia|Consultar y guardar datos en SQLite y gestionar preferencias<br>locales.|
|API / sincronización|Autenticación, comunicación con servidor, respaldo y<br>resolución de errores.|



### **15.2. Entidades de datos sugeridas** 

|**Entidad**|**Información principal**|
|---|---|
|User|Identificador, nombre de usuario, correo, propósito, metas y<br>configuración.|
|PlayerProfile|Nivel, XP acumulada, Hojas de mate, unidades de media vida,<br>racha y avatar.|
|Habit|Nombre, origen (recomendado o personalizado), recompensa,<br>XP, estado activo.|
|HabitSchedule|Hábito, días o fechas programadas y vigencia.|
|HabitOccurrence|Hábito, fecha de jornada, estado, hora de registro y recompensa<br>aplicada.|
|MoodEntry|Estado emocional, fecha y contexto.|
|Challenge|Hábito de origen, tipo, descripción, plazo, estado y recompensa<br>o consecuencia.|
|SecondaryMission|Descripción, aceptación, condición de finalización y<br>recompensas.|
|Reward|Nombre, tipo, costo en Hojas de mate, requisitos de nivel y<br>disponibilidad.|
|InventoryItem|Cosmético adquirido y estado equipado.|
|DailySummary|Fecha, hábitos programados, cumplidos, porcentaje,<br>clasificación y mensaje.|
|CurrencyTransaction|Tipo de movimiento, cantidad, origen, fecha e identificador<br>único.|



Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

### **15.3. Operaciones que deben ejecutarse como transacciones** 

Completar un hábito no debe consistir en actualizar campos independientes sin control. La operación debe validar que el hábito pertenece al usuario, corresponde a la fecha correcta y no fue recompensado previamente; registrar el cumplimiento; acreditar Hojas de mate y XP; actualizar el nivel si corresponde; y guardar el movimiento en el historial. 

De manera equivalente, procesar un incumplimiento debe registrar el estado, crear un desafío único y programar la consecuencia de HP para el vencimiento. El descuento no debe aplicarse dos veces si el proceso automático se ejecuta más de una vez. 

### **15.4. Procesamiento de la hora límite en dispositivos móviles** 

No debe suponerse que una aplicación móvil puede ejecutar código exactamente a las 4:00 a. m. mientras está cerrada. Android e iOS pueden aplazar o limitar tareas en segundo plano por ahorro de batería y políticas del sistema operativo. 

Por ello, se recomienda combinar recordatorios o notificaciones locales con un mecanismo de reconciliación: cada vez que la aplicación se abre, vuelve del segundo plano o recupera conexión, compara la hora actual con la última jornada procesada y procesa todos los cortes vencidos que falten. El servidor también puede validar fechas y estados al sincronizar. 

El resultado funcional será que los hábitos pendientes se procesen al cumplirse el corte lógico de las 4:00 a. m., aunque la actualización visual pueda ocurrir cuando el sistema operativo permita ejecutar la aplicación o cuando el usuario vuelva a abrirla. La implementación debe utilizar la zona horaria local del usuario y manejar cambios de hora. 

### **15.5. Validaciones esenciales** 

- No acreditar dos veces Hojas de mate o XP por la misma ocurrencia de hábito. 

- No descontar dos veces HP por el mismo incumplimiento. 

- No permitir más de 10 HP ni menos de 0 HP. 

- No permitir canjes si el saldo de Hojas de mate es insuficiente. 

- No superar 30 Hojas de mate ni 50 XP en un hábito personalizado. 

- No completar un desafío vencido si las reglas de plazo ya lo cerraron. 

- No alterar el historial cuando se edita o elimina un hábito. 

- No cerrar dos veces una misma jornada ni duplicar sus efectos. 

- No otorgar cosméticos sin cumplir el nivel requerido y disponer del saldo necesario. 

## **16. Reglas de negocio consolidadas** 

|**Código**|**Regla**|
|---|---|
|RN-01|La aplicación utiliza una arquitectura híbrida con persistencia<br>local y sincronización con servidor.|
|RN-02|La primera apertura presenta registro, autenticación y<br>configuración inicial; las siguientes abren Home si la sesión es<br>válida.|
|RN-03|El usuario registra nombre de usuario, correo, contraseña,<br>propósito personal y metas.|
|RN-04|Existen hábitos recomendados y hábitos personalizados<br>editables y eliminables.|
|RN-05|Los hábitos recomendados tienen recompensas definidas por el<br>equipo.|
|RN-06|Los hábitos personalizados permiten asignar hasta 30 Hojas de<br>mate y hasta 50 XP.|



Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

|RN-07|El usuario programa libremente los días o fechas de cada hábito<br>desde el Mapa.|
|---|---|
|RN-08|El usuario registra manualmente el cumplimiento; lo que siga<br>pendiente al corte se considera incumplido.|
|RN-09|La jornada termina a las 4:00 a. m. del día siguiente y puede<br>cerrarse manualmente.|
|RN-10|Cada hábito cumplido acredita sus Hojas de mate y XP una sola<br>vez.|
|RN-11|Cada hábito incumplido genera un desafío relacionado con ese<br>hábito.|
|RN-12|Un incumplimiento puede descontar 1/2 HP; varios<br>incumplimientos acumulan sus descuentos.|
|RN-13|El máximo de HP es 10, representado internamente por 20<br>unidades de media vida.|
|RN-14|Completar un desafío de recuperación devuelve 1/2 HP, sin<br>superar el máximo.|
|RN-15|Al llegar a 0 HP se activa el Superdesafío para recuperar todas<br>las vidas y se restringen las acciones definidas por el equipo.|
|RN-16|Las misiones secundarias son voluntarias y otorgan Hojas de<br>mate y XP.|
|RN-17|Las Hojas de mate se gastan al canjear recompensas y<br>cosméticos.|
|RN-18|Los cosméticos se habilitan por nivel y se compran con Hojas de<br>mate.|
|RN-19|El calendario clasifica los días por porcentaje de hábitos<br>cumplidos.|
|RN-20|Los mensajes motivacionales se personalizan inicialmente<br>mediante un diccionario local; la IA queda como posible<br>evolución.|



## **17. Aspectos pendientes de definición** 

Las siguientes decisiones no están cerradas en la información proporcionada. Se incluyen para evitar que el equipo las interprete de manera diferente durante el desarrollo. 

|**Pendiente**|**Qué debe decidir el equipo**|
|---|---|
|Servidor y backend|Tecnología, base de datos, API, hosting y responsable de<br>autenticación.|
|Sincronización|Qué datos se envían, con qué frecuencia y cómo se resuelven<br>conflictos entre dispositivos.|
|Saldos iniciales|Cantidad inicial de Hojas de mate, XP y nivel al crear la cuenta.|
|Progresión|XP necesaria por nivel, curva de progresión y nivel máximo, si<br>existe.|
|Plazo exacto del desafío|Confirmar si todo desafío generado por incumplimiento vence a<br>las 4:00 a. m. del siguiente día calendario posterior a su<br>creación, o si se aplica otra regla.|
|Incumplimientos múltiples|Confirmar si cada desafío se puede completar por separado y si<br>cada uno evita exactamente la pérdida de 1/2 HP asociada.|
|Desafíos de recuperación|Catálogo, dificultad, validación de cumplimiento y límites de<br>recuperación por día.|
|Superdesafío|Contenido, validación y si restaura exactamente 10 HP incluso<br>si el usuario ya recuperó alguna fracción.|
|Bloqueo con 0 HP|Definir exactamente qué pantallas y acciones quedan<br>bloqueadas y cuáles siguen disponibles para completar el<br>Superdesafío.|
|Estado emocional|Confirmar si se puede cambiar durante el día y si el último|



Documento explicativo funcional y técnico  •  React Native 

TECHPHIC  |  THE LIFE GAME 

||estado registrado o el primero determina el mensaje.|
|---|---|
|Mensajes|Cantidad, categorías, tono y mecanismo de selección del<br>diccionario inicial.|
|Misiones secundarias|Catálogo, recompensas, duración y cantidad de misiones<br>activas simultáneamente.|
|Catálogo de recompensas|Recompensas iniciales, cosméticos, costos y requisitos de<br>nivel.|
|Día sin hábitos|Definir el mensaje y el efecto sobre la racha cuando no existen<br>hábitos programados.|
|Plataformas|Confirmar Android, iOS o ambas, y si el proyecto utilizará Expo o<br>React Native CLI.|



## **Conclusión** 

The Life Game se concibe como un gestor de hábitos con una estructura de progresión inspirada en los videojuegos RPG. Su funcionamiento conecta la programación de actividades, el registro manual de resultados, el estado emocional, las recompensas, la experiencia, las vidas y los desafíos en un ciclo diario. 

La arquitectura híbrida permite que la aplicación responda desde el dispositivo y mantenga un respaldo en servidor. React Native será responsable de la experiencia móvil, mientras que una separación clara entre interfaz, reglas de negocio, persistencia y sincronización facilitará la evolución del producto. 

Este documento establece la base funcional y técnica conocida a la fecha. Los puntos identificados como pendientes deben acordarse antes de implementar las reglas correspondientes, especialmente las fechas límite de los desafíos, el bloqueo al llegar a 0 HP y la sincronización con el servidor. 

Documento explicativo funcional y técnico  •  React Native 

