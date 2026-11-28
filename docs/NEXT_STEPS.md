# Siguientes pasos

> Actualizado: 2026-11-28, al cerrar la sesión de la Fase 10. Pensado para **empezar una sesión nueva de Claude Code**.
> **Claude reescribe este archivo al terminar cada fase.**

## 1. Dónde estamos

- **Hechas y probadas en Expo Go:** Fases 1, 3, 4, 5, 6, 7, 8, 9 y 10 (solo recompensas reales). Cubren todo el alcance mínimo de la Entrega 1 (C-20): login, hábitos asignados a días, HUD, recompensas, desafíos por incumplimiento y por vidas perdidas, misiones secundarias, Mapa y cierre de jornada. Además, la Tienda de recompensas reales.
- **Pruebas automáticas:** 171 (Jest). `npx tsc --noEmit` y `npx expo lint` sin errores.
- **Git:** 4 PR apilados, abiertos y sin merge: #1 (Fases 1–6) ← #2 (Fase 7) ← #3 (Fases 8–9) ← #4 (Fase 10). El merge se hace **en orden, empezando por el #1** (`GIT_WORKFLOW.md` §8). Última rama: `feature/fase-10-tienda`.
- **Decisiones abiertas** (ninguna bloquea): P-36 (dónde corre Node), P-38 (arte a partir del logo), P-40 (correo de soporte), P-56 (licencia y universidad). P-60 (música de Nemorphic) aplazada.

## 2. Revisar el domingo 29 al abrir la app

- El 28 aparece **cerrado solo** en el Mapa (cierre automático, `AUTO`), con su color, y la racha se actualiza.
- Los hábitos que quedaron pendientes el 28 generaron sus desafíos (con plazo de 72 h desde las 04:00 del 29).

## 3. Qué falta (extras del lunes 30, en este orden del roadmap)

1. **Ánimo + mini desafío + mensajes** (Fase 7, extra). El dominio ya elige la variante por el ánimo (`variantForMood`, `domain/challenges.ts`) y la tabla `mood_entries` existe. Falta:
   - selector de ánimo en Inicio (`setMood`: registra el ánimo y cambia la variante de los desafíos pendientes de la jornada abierta, RN-MOOD-08, ESC-25);
   - rechazar el mini / pasar al normal / deshacer el rechazo (`DECLINED`, ESC-10);
   - mensaje empático al invocar el mini y mensaje de apertura (C-33, P-32).
2. **Superdesafío** (Fase 8, extra): al llegar a 0 HP se crea uno con una tarea por hábito activo (`super_challenge_tasks`); completar todas → HP = 20 (ESC-23). La cancelación al recuperar a 0 HP ya está (`cancelActiveSuperChallenge`, ESC-22).
3. **Pulido pixel art** (C-22): fuente pixel (*Press Start 2P*, OFL), iconos de las pestañas (hoy son cuadrados), corazones. Depende en parte de P-38.
4. **APK de prueba** (Fase 12, opcional): EAS Build.

**Después de la entrega:** Fase 2 (backend con los datos del servidor del profesor), Fase 11 (sincronización y seguridad), cosméticos y avatar (Fase 10), recordatorios (P-47), música (P-60).

## 4. Cómo continuar en una sesión nueva de Claude Code

1. Abrir la terminal en la **raíz** del repositorio (`C:\Users\USUARIO\Desktop\Estudio\TheLifeGame`) y ejecutar `claude`. Así se cargan `CLAUDE.md` y `.claude/rules/`.
2. Comprobar la rama: `git switch feature/fase-10-tienda` (o `main` si ya se hizo el merge de los 4 PR).
3. Pedirle algo como:
   > "Lee docs/NEXT_STEPS.md. Apruebo el extra 1 (ánimo + mini desafío + mensajes). Trabaja en una rama nueva desde feature/fase-10-tienda y detente al terminar para probar."
4. Claude crea la rama, implementa con pruebas, actualiza la documentación y se detiene. Tras probar en Expo Go: "aprobado, commit, push y PR".
5. Para probar: en `app/`, `npx expo start -c` y escanear el QR con Expo Go (SDK 58). Sin la misma Wi-Fi: `npx expo start --tunnel`.

## 5. Si Expo Go falla al abrir

- `Cannot find native module 'ExpoSQLite'` → `Ctrl+C` y `npx expo start -c` (caché de Metro). Detalle en `ARCHITECTURE.md` §10.
- Desactivar la actualización automática de Expo Go en la Play Store antes de la entrega.
