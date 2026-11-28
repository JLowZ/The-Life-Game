---
paths:
  - "app/**/*"
---

# Reglas de frontend — Expo + React Native + TypeScript (`app/`)

Complementan `CLAUDE.md` y `docs/ARCHITECTURE.md` §4.

## 1. Antes de escribir código

- Lee la versión mayor de `expo` en `app/package.json` (hoy **SDK 58**) y consulta la documentación **versionada**: `https://docs.expo.dev/versions/v58.0.0/`. **No confíes en tu memoria**: las API de Expo cambian en cada SDK.
- `app/AGENTS.md` se aplica **completo**: Expo Router, TypeScript, `npx expo install`, lint y comprobación de tipos. Lo decidieron P-21 y P-22. Hasta que la Fase 3 haga la migración, la app sigue siendo la plantilla JavaScript: no la migres fuera de esa fase.
- Confirma que la tarea pertenece a la fase o al bloque aprobado (`docs/DEVELOPMENT_ROADMAP.md`).
- **Plataforma objetivo: solo Android** (Expo Go). No inviertas tiempo en particularidades de iOS ni web.

## 2. Dependencias

- Instala **solo** con `npx expo install <paquete>` y **tras aprobación**.
- Aprobadas por decisión: `expo-router` (y sus dependencias), `expo-sqlite`, `expo-secure-store`, `zustand`, `jest-expo`/`jest`. `expo-crypto` se usará si hace falta para los UUID.
- Nada que no funcione en Expo Go sin consultarlo antes (obligaría a un development build).
- No actualices `expo`, `react` ni `react-native`. Diagnostica con `npx expo-doctor`.
- Nunca crees ni edites `ios/` o `android/` a mano.

## 3. Estructura y capas

```text
src/app (rutas) → src/screens · src/components → src/state → src/services → src/domain
                                                                   ↘ src/database, src/api
```

- **`src/app/`** (Expo Router): solo rutas y layouts. Cada ruta es un envoltorio delgado que renderiza su pantalla de `src/screens/`. Sin lógica.
- **`src/screens/`**: composición de la pantalla. Leen stores y llaman a servicios. Sin reglas de negocio.
- **`src/components/`**: componentes reutilizables y presentacionales con props tipadas. Nunca importan `database`, `api`, `services` ni `state`, salvo componentes contenedores explícitos.
- **`src/state/`** (Zustand): proyección de SQLite para la interfaz.
- **`src/services/`**: casos de uso; una transacción de SQLite cada uno; refrescan los stores al terminar.
- **`src/domain/`**: reglas puras (ver `business-logic.md`).
- **`src/database/`**: la única capa con SQL.
- **`src/api/`**: autenticación y respaldo.
- **`src/content/`**: `messages.json`, categorías, cosméticos (datos).
- **`src/config/`**: constantes de juego, tema pixel art, entorno.

## 4. TypeScript

- Modo `strict`.
- Prohibido `any` salvo justificación comentada. Usa `unknown` con validación en los bordes (respuestas de la API, filas de SQLite).
- Valores del juego como **tipos unión** (`type Mood = 'VERY_HAPPY' | …`) definidos en `src/domain/types.ts`.
- Tipos distintos para conceptos distintos: por ejemplo, `HpHalfUnits` frente a vidas mostradas. Nunca mezcles unidades.
- `npx tsc --noEmit` y `npx expo lint` deben pasar antes de terminar una tarea.

## 5. Componentes y estética pixel art

- Componentes funcionales, uno por archivo (`PascalCase.tsx`), con props tipadas.
- Estilos con `StyleSheet.create` y tokens del tema (`src/config/theme.ts`): paleta, espaciados en múltiplos de la rejilla de píxel, fuente pixel (P-38; propuesta *Press Start 2P*, licencia OFL).
- Sprites con escalado de **vecino más cercano** para que el pixel art no se vea borroso. Consulta en la documentación de SDK 58 cómo hacerlo con el componente de imagen.
- **Primero que funcione, luego que sea bonito** (C-22): en las Fases 4 a 10 basta un estilo pixel art sencillo y coherente, con la paleta y el estilo del **logo** de la app (`assets/`) y los bocetos del equipo.
- **Entrega 1:** avatar fijo de marcador, **sin cosméticos** ni pantalla de creación del avatar (C-20).
- El HUD (`Hud`, `HeartsBar`, `XpBar`, `StreakBadge`, `LeavesBalance`) recibe valores ya calculados por el dominio.
- Listas largas con `FlatList`.

## 6. Navegación (Expo Router)

- `(auth)`: welcome, login (usuario **o** correo), register (con el aviso de privacidad), onboarding (propósito → metas con categoría → avatar).
- `(tabs)`: Home (`index`), `map`, `challenges`, `shop` (en ese orden, P-62), con el HUD siempre visible (cabecera `HudHeader`). El engranaje del HUD (en las cuatro pestañas) abre `settings` (P-61).
- **Expo Router 58:** todo `Stack.Protected` lleva `redirectTo` con una ruta concreta; sin él, el destino por defecto puede ser un grupo sin `index` y provocar un bucle de redirecciones.
- El `_layout.tsx` raíz redirige según la sesión y ejecuta la reconciliación al entrar y al volver al primer plano.
- **A 0 HP:** las acciones bloqueadas (programar, marcar, comprar, canjear, misiones) se muestran **deshabilitadas con una explicación**. Desafíos y la personalización del avatar funcionan con normalidad.

## 7. Estado (Zustand)

- Un store por dominio (`usePlayerStore`, `useHabitsStore`, `useChallengesStore`, `useSessionStore`).
- SQLite es la fuente de verdad. Los stores se recargan desde los servicios.
- Lee siempre con selectores: `usePlayerStore(s => s.hpHalfUnits)`.
- No dupliques valores derivados en los stores (corazones, progreso de la barra de XP, clasificación): se calculan con funciones del dominio.

## 8. Persistencia

- Los datos del juego van en **SQLite**, a través de repositorios y en transacciones.
- El token va **solo** en `expo-secure-store`. Las contraseñas **nunca** se guardan.
- Esquema local versionado con `PRAGMA user_version`. Las migraciones deben poder ejecutarse varias veces sin error.
- **Cerrar sesión no borra datos** si el respaldo falló (RN-AUTH-08).
- Nunca uses `new Date()` directamente en la lógica: usa las funciones del dominio con `now` inyectado.

## 9. Accesibilidad y diseño adaptable

- `accessibilityRole` y `accessibilityLabel` en los elementos interactivos y en los iconos (corazones: "HP 7,5 de 10").
- Zonas táctiles de 48 dp como mínimo.
- La información nunca se transmite **solo con color**: la clasificación del Mapa lleva también un icono o texto.
- Contraste AA y respeto del escalado de fuente del sistema (vigila que la fuente pixel art siga siendo legible).
- Flexbox, `useWindowDimensions` y áreas seguras. Prueba en pantallas de unos 360 dp. Orientación vertical.

## 10. Errores y retroalimentación

- Ninguna acción se pierde por la red: primero se guarda en local.
- Validaciones en español, junto al campo afectado.
- Error boundary en la raíz y `try/catch` en los servicios; mensajes amables, sin trazas técnicas.
- Indicador discreto de "datos sin respaldar" o "error de respaldo".
- Feedback inmediato al marcar un hábito: animación o toast con el botón **Deshacer** durante 10 s.
- **Cuenta atrás** visible en los desafíos.

## 11. Textos y tono

- Interfaz en español con la terminología oficial: "Hojas de mate", "Desafíos", "Mini desafío", "Superdesafío", "Día Finalizado", "Misiones del día", "Sin actividades programadas".
- **Nunca** "castigo".
- Los mensajes salen de `src/content/messages.json`, no se escriben en los componentes. En estados bajos, tono empático y sin culpa.
- Sin IA como requisito. El contenido es propio o tiene una licencia compatible con el uso comercial.

## 12. Antes de dar por terminada una tarea

- La app arranca con `npx expo start` en Expo Go (Android) sin errores nuevos.
- `npx tsc --noEmit`, `npx expo lint` y las pruebas (`npx jest`) pasan.
- Indica qué flujos hay que probar a mano en el teléfono.
