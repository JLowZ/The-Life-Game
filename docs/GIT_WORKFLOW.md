# Guía de Git y GitHub — Equipo TechPhic

> Repositorio: **https://github.com/JLowZ/The-Life-Game** (público) · Creada el 2026-11-25

Esta guía explica cómo trabajar los tres en el mismo código sin pisaros los cambios. Léela entera una vez y tenla a mano.

---

## 1. Conceptos en 2 minutos

| Concepto | Qué es | Analogía |
|---|---|---|
| **Repositorio (repo)** | La carpeta del proyecto con todo su historial. | Un libro con todas sus versiones guardadas. |
| **Commit** | Una "foto" de los cambios, con un mensaje que explica qué hiciste. | Guardar la partida con una nota. |
| **Rama (branch)** | Una línea de trabajo paralela. `main` es la rama oficial. | Una copia del libro donde escribes un capítulo nuevo sin tocar el original. |
| **Push** | Subir tus commits a GitHub. | — |
| **Pull** | Bajar a tu PC los cambios de los demás. | — |
| **Pull Request (PR)** | Una petición para unir tu rama a `main`, que otro revisa antes. | Pedir que revisen tu capítulo antes de añadirlo al libro. |
| **Merge** | Unir los cambios de una rama con otra. | — |
| **Conflicto** | Dos personas cambiaron las mismas líneas y Git no sabe cuál quedarse. | Hay que elegir a mano. |
| **Issue** | Una tarea, error o idea registrada en GitHub. | Una tarjeta del tablero. |

**Regla de oro:** `main` siempre debe funcionar. Nadie trabaja directamente en `main`.

---

## 2. Configuración inicial (una sola vez)

### 2.1. Cuentas

- **David:** crea una cuenta en https://github.com/signup y pásale tu usuario a Juan José.
- **Juan José (dueño):** en el repositorio, ve a **Settings → Collaborators → Add people** y añade a `senkoxl` (Dylan) y a David.
- **Dylan y David:** acepta la invitación que llega por correo (o en https://github.com/notifications).
- **Si sois estudiantes**, pedid el **GitHub Student Developer Pack** (https://education.github.com/pack): da GitHub Pro y otras herramientas gratis.

### 2.2. Identidad en Git (cada uno, en su PC)

Git firma cada commit con un nombre y un correo. GitHub usa ese **correo** para asociar el commit a vuestra cuenta, así que tiene que ser uno de los correos registrados en vuestro perfil.

```powershell
git config --global user.name "TuUsuarioDeGitHub"
git config --global user.email "el-correo-de-tu-cuenta-de-github"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

*Opcional:* el repositorio es público y el correo de cada commit es visible. Si alguien prefiere ocultarlo, puede activar en GitHub **Settings → Emails → "Keep my email addresses private"** y usar la dirección `…@users.noreply.github.com` que aparece allí.

### 2.3. Descargar el proyecto (Dylan y David)

```powershell
cd "C:\ruta\donde\quieras"
git clone https://github.com/JLowZ/The-Life-Game.git
cd The-Life-Game\app;      npm install
cd ..\backend;             npm install
```

- Copia `backend/.env.example` como `backend/.env` y pon tus datos locales de MySQL. **El `.env` nunca se sube.**
- Abre la carpeta raíz `The-Life-Game` en VS Code y Claude Code **desde la raíz**.

---

## 3. Primera subida del proyecto (hecha el 2026-11-25)

Se hizo una sola vez, desde el PC de Juan José. Queda documentada como referencia:

1. Se movió `app/.git` (el repositorio que creó la plantilla de Expo) a una copia de seguridad **fuera** del proyecto. Un repositorio dentro de otro hace que GitHub no suba el código de la carpeta interior.
2. Se crearon en la raíz `.gitignore` (`node_modules/`, `.env`, `.expo/`…), `.gitattributes` (saltos de línea) y `LICENSE`.
3. Se ejecutó:

```powershell
git init -b main
git add .
git status                       # revisar que NO aparezcan node_modules ni .env
git commit -m "chore: estructura inicial y harness de la Fase 0"
git remote add origin https://github.com/JLowZ/The-Life-Game.git
git push -u origin main
```

La primera vez se abre el navegador para iniciar sesión en GitHub (Git Credential Manager).

### 3.1. Proteger `main` (después de la primera subida)

Es gratis porque el repositorio es público.

1. Ve a **Settings → Branches → Add branch ruleset** (o "Add rule").
2. Aplícalo a la rama `main`.
3. Activa **Require a pull request before merging** con **1 aprobación**, y **Block force pushes**.

Desde ese momento, nadie, ni siquiera el dueño, puede subir directamente a `main`.

---

## 4. Flujo de trabajo diario

```text
main ──●────────────●────────────●──▶
        \          / (PR + revisión)
         ●──●──●──●   feature/fase-6-habitos
```

```powershell
# 1. Partir de main actualizado
git switch main
git pull

# 2. Crear tu rama para la tarea
git switch -c feature/fase-6-habitos

# 3. Trabajar… y guardar en commits pequeños
git status                          # ver qué cambió
git add app/src/domain/gameDay.ts   # o "git add ." si revisaste el status
git commit -m "feat(app): calcular la fecha de jornada con corte a las 04:00"

# 4. Subir tu rama
git push -u origin feature/fase-6-habitos    # la primera vez; después solo "git push"

# 5. En GitHub: botón "Compare & pull request"
#    - Título claro y descripción: qué hiciste, cómo probarlo, issue que cierra ("Closes #12")
#    - Asigna como revisor a un compañero

# 6. El compañero revisa, comenta y aprueba → "Squash and merge" → "Delete branch"

# 7. Volver a main y actualizar
git switch main
git pull
git branch -d feature/fase-6-habitos
```

**En VS Code**, el panel **Source Control** (`Ctrl+Shift+G`) hace lo mismo con botones: ver los cambios, escribir el mensaje, hacer commit y sincronizar. La rama actual aparece abajo a la izquierda.

### 4.1. Nombres de ramas

| Tipo | Formato | Ejemplo |
|---|---|---|
| Funcionalidad | `feature/<fase>-<tema>` | `feature/fase-5-hud` |
| Corrección | `fix/<tema>` | `fix/corazones-media-vida` |
| Documentación | `docs/<tema>` | `docs/decisiones-p12` |
| Mantenimiento | `chore/<tema>` | `chore/actualizar-gitignore` |

### 4.2. Mensajes de commit

Formato *Conventional Commits*, en español y en imperativo: `tipo(ámbito): qué hace`.

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `feat` | Funcionalidad nueva | `feat(app): marcar hábito con ventana de deshacer` |
| `fix` | Corrección | `fix(backend): login con usuario en mayúsculas` |
| `docs` | Documentación | `docs: resolver P-12 en DECISIONS` |
| `test` | Pruebas | `test(app): escenarios ESC-05 a ESC-07` |
| `refactor` | Reorganizar sin cambiar el comportamiento | `refactor(app): extraer cálculo de corazones` |
| `chore` | Configuración y dependencias | `chore(app): instalar zustand` |

---

## 5. Reglas del equipo

1. **Nunca** trabajar directamente en `main`.
2. `git pull` en `main` **antes** de crear una rama.
3. **Una rama = una tarea**, con Pull Requests pequeños (fáciles de revisar).
4. Revisar `git status` antes de cada commit.
5. **Nunca subir:** `.env`, contraseñas, tokens, `node_modules/`, datos reales de usuarios. El repositorio es público: **lo que se sube, queda visible para siempre**, aunque luego se borre.
6. Todo PR lo revisa **otro integrante** antes del merge.
7. Si un PR cambia una regla de negocio, debe actualizar también `docs/` (procedimiento de `CLAUDE.md` §13).
8. Las pruebas deben pasar antes de pedir revisión.

---

## 6. Conflictos

Aparecen cuando dos ramas cambian las mismas líneas. Git marca el archivo así:

```text
<<<<<<< HEAD
lo que hay en tu rama
=======
lo que viene de la otra rama
>>>>>>> main
```

**Cómo resolverlo:**

1. Actualiza tu rama con `main`:

   ```powershell
   git switch main; git pull
   git switch tu-rama; git merge main
   ```

2. Abre el archivo en VS Code y elige **Accept Current**, **Accept Incoming** o **Accept Both**, o edítalo a mano.
3. Comprueba que la app compila y las pruebas pasan.
4. Termina el merge:

   ```powershell
   git add <archivo>; git commit
   ```

5. Si tienes dudas, **pregunta antes de forzar nada**. Nunca uses `git push --force` sobre ramas compartidas.

---

## 7. Scrum con GitHub (Issues + Projects)

1. **Issues:** una tarea por issue, con etiquetas `app`, `backend`, `docs`, `bug` y `decisión`. Las decisiones abiertas (`P-xx`) pueden ser issues con la etiqueta `decisión`.
2. **Projects:** ve a **Projects → New project → Board** y crea las columnas **Backlog · Sprint actual · En progreso · En revisión · Hecho**.
3. Al abrir un PR, escribe `Closes #<número>` en su descripción: el issue se cierra solo al hacer el merge.
4. Para la Entrega 1, el sprint es el plan día a día de `DEVELOPMENT_ROADMAP.md`.

---

## 8. Claude Code y Git

- Claude **no hace commit ni push** si no se lo pedís. Cuando se lo pidáis, trabajará en una rama y abrirá el PR.
- **Permisos (2026-11-27):** `.claude/settings.local.json` (personal, en `.gitignore`) permite a Claude `git add`, `git commit`, `git switch`, `git push` a ramas y `gh pr create/view/list`. Están **prohibidos** `push --force` y el push directo a `main`. Cada integrante que quiera lo mismo crea su propio archivo.
- **GitHub CLI (`gh`)** instalada y autenticada en el PC de JLowZ (`winget install GitHub.cli` + `gh auth login`). En Git Bash, si `gh` no aparece en el PATH, está en `C:\Program Files\GitHub CLI\gh.exe` (reiniciar la terminal lo arregla).
- **PR apilados (stacked):** cada fase sale de la rama de la anterior y su PR apunta a esa rama, así cada PR muestra solo su fase. Ramas: `feature/fases-1-a-6-base` (PR #1 → `main`) → `feature/fase-7-desafios` (PR #2) → `feature/fases-8-9-cierre-mapa` (PR #3) → `feature/fase-10-tienda` (PR #4).
- **Cómo hacer el merge:** en orden, empezando por el #1. Al hacer el merge de uno y borrar su rama, GitHub cambia la base del siguiente a `main`. Si no lo hace, edita la base del PR a mano ("Edit" junto al título).
- **Rama nueva:** sale de la última rama (`feature/fase-10-tienda`) o de `main` si ya se hizo el merge de todo.
- Revisad siempre lo que cambió (`git diff` o el panel de VS Code) antes de aprobar.
- Claude debe trabajar con el repositorio abierto **desde la raíz**.

---

## 9. Comandos útiles y de emergencia

| Comando | Para qué |
|---|---|
| `git status` | Ver qué cambió y en qué rama estás. |
| `git log --oneline --graph -15` | Historial reciente. |
| `git diff` | Ver los cambios línea a línea antes del commit. |
| `git stash` / `git stash pop` | Guardar temporalmente cambios sin commit (por ejemplo, para cambiar de rama). |
| `git restore <archivo>` | ⚠️ **Descarta** los cambios no guardados de ese archivo. No se pueden recuperar. |
| `git switch -` | Volver a la rama anterior. |

---

## 10. Más adelante

- **GitHub Actions:** ejecutar las pruebas automáticamente en cada Pull Request (cuando existan las pruebas).
- **Releases:** etiquetar versiones (`v0.1.0` para la Entrega 1).
