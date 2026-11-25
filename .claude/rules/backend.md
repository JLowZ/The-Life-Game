---
paths:
  - "backend/**/*"
---

# Reglas de backend — Node.js + Express + MySQL (`backend/`)

Complementan `CLAUDE.md` y `docs/ARCHITECTURE.md` §5–§7.

## 1. Stack

- Node.js **24.19.0**, npm **11.13.0**.
- **Express 5.3**:
  - los errores `async` llegan solos al middleware de errores;
  - la sintaxis de rutas cambió (comodines con nombre, como `/*splat`);
  - consulta la documentación de Express 5.
- **mysql2 3.x** con la API de promesas y un pool de conexiones.
- **JavaScript CommonJS** (`require`/`module.exports`) durante la Entrega 1 (P-22). La migración a TypeScript llega después (P-52): no la adelantes.
- Dependencias aprobadas por decisión: `bcryptjs` (P-26), `jest` + `supertest` (P-24). Cualquier otra requiere aprobación.

## 2. Capas

```text
routes → middleware → controllers → services → repositories → MySQL
```

| Carpeta | Responsabilidad | Prohibido |
|---|---|---|
| `src/routes/` | Asociar ruta → middleware + controller | Lógica, SQL |
| `src/middleware/` | Autenticación, validación, errores, 404 | Reglas de juego |
| `src/controllers/` | Leer `req`, llamar al servicio, responder | SQL |
| `src/services/` | Casos de uso y transacciones | `req`/`res` |
| `src/repositories/` | SQL parametrizado | Reglas de negocio |
| `src/config/` | Entorno y pool | Secretos escritos en el código |

`src/app.js` construye la app (sin `listen`, para supertest) y `src/server.js` la arranca escuchando en `0.0.0.0:PORT`.

## 3. API (Entrega 1)

- `/api/v1`, JSON en camelCase, códigos 400 / 401 / 403 / 404 / 409 / 422 / 500.
- Error uniforme: `{ "error": { "code": "UPPER_SNAKE", "message": "en español", "details": {} } }`.
- Endpoints de la Entrega 1:
  - `GET /health`;
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`;
  - `GET /me`;
  - `PUT /backup` y `GET /backup`.
- **No crees endpoints fuera de la fase aprobada.** Las tablas del juego en el servidor llegan en la Fase 11.

## 4. Validación

- Valida **toda** la entrada (tipos, obligatorios, longitudes, lista blanca de campos).
- `username`: único **sin distinguir mayúsculas** (`username_normalized`). `email`: en minúsculas y único. Contraseña: **mínimo 6 caracteres** (P-48).
- **Inicio de sesión:** el campo `identifier` acepta el **usuario o el correo**.
- El `userId` sale **siempre del token**, nunca del cuerpo de la petición.
- **Respaldo:** valida el tamaño, `schemaVersion` y `checksum`. Solo el dueño lee y escribe su propia instantánea.

## 5. Autenticación y seguridad

- **bcryptjs** para las contraseñas (coste ≥ 10). Nunca en logs ni en respuestas.
- **Token opaco:** 32 bytes aleatorios (`crypto.randomBytes`), enviado al cliente. En `auth_sessions` solo se guarda su **SHA-256**, con `expires_at` a 30 días. Cerrar sesión rellena `revoked_at`.
- Errores de inicio de sesión **genéricos**.
- Secretos solo en `.env` (no versionado); `.env.example` sin valores reales.
- **El repositorio es público:** ningún secreto, contraseña de base de datos ni dato real en el código, la documentación, las pruebas o los commits.
- SQL **solo parametrizado** (`pool.execute(sql, params)`). Jamás concatenes valores.
- Límite del cuerpo de la petición (por ejemplo, 5 MB para el respaldo). CORS restringido.
- Logs sin datos sensibles (contraseñas, tokens, ánimo, correo completo).
- HTTPS en producción.

## 6. Errores

- `AppError` con `status` y `code`, y un **único** middleware de errores. Sin stack traces ni SQL en las respuestas.
- Middleware 404 para las rutas inexistentes.
- `ER_DUP_ENTRY` en el registro → 409 con un código claro (`USERNAME_TAKEN` o `EMAIL_TAKEN`).

## 7. Transacciones

```js
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  // validar → escribir → (UNIQUE como última barrera)
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

## 8. Base de datos y SQL portable

- Tablas en plural y `snake_case`; columnas `snake_case`; UUID en `CHAR(36)`; `DATETIME(3)` en UTC; InnoDB; `utf8mb4_unicode_ci`.
- **Portable a PostgreSQL** (R-30, posible Supabase):
  - **sin** `ENUM` (usa `VARCHAR` + `CHECK`), `UNSIGNED`, `ON UPDATE CURRENT_TIMESTAMP` ni comillas invertidas;
  - `BOOLEAN` en lugar de `TINYINT(1)` explícito;
  - las fechas las pone la aplicación.
- XAMPP suele usar **MariaDB**: verifica la versión (R-22).
- **Migraciones:** scripts numerados en `database/migrations/` (`001_users.sql`…), que se aplican en orden. **No crees ni modifiques tablas sin aprobación** del modelo (Fase 1).
- **Operaciones destructivas** (`DROP`, `TRUNCATE`, `DELETE` masivo, `ALTER` con pérdida de datos): **solo con autorización explícita**, explicando antes qué se pierde.
- Base de datos de pruebas separada.
- Dónde se ejecuta Node respecto al servidor del profesor: P-36.

## 9. Pruebas

- Jest + supertest contra `app.js` y una base de datos de pruebas.
- **Cubrir:**
  - registro (duplicados de usuario sin distinguir mayúsculas y de correo);
  - inicio de sesión con usuario y con correo;
  - credenciales incorrectas;
  - token ausente, revocado o expirado;
  - respaldo de ida y vuelta;
  - un usuario no puede leer el respaldo de otro;
  - formato de error.
- La suite completa debe pasar antes de terminar.

## 10. Scripts

En la Fase 2 se añaden `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"` y `"test": "jest"`, y se corrige `"main"`. El Firewall de Windows debe permitir el puerto en las redes privadas.
