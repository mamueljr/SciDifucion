# Resumen Codex de SciDifusión

## Alcance de la revisión

Este resumen se hizo en dos pasadas:

1. Revisión del proyecto real sin entrar a `/docs`.
2. Revisión posterior de `/docs/IA` para comparar qué tan cierta está la documentación frente al código actual.

No se copiaron contraseñas reales ni tokens al documento. Las credenciales detectadas se describen por tipo y ubicación, pero quedan redactadas por seguridad.

## Qué es el proyecto

SciDifusión es una plataforma web de divulgación científica y académica. Funciona como repositorio institucional donde usuarios pueden consultar publicaciones y donde usuarios con permisos, especialmente investigadores y administradores, pueden crear y administrar contenido académico con archivos adjuntos.

El proyecto está pensado para operar en un hosting compartido, por eso su arquitectura real de producción usa frontend estático compilado con Vite y endpoints PHP conectados a MySQL.

## Para qué sirve

Sirve para:

- Publicar artículos, videos, podcasts e infografías en un repositorio académico.
- Registrar e iniciar sesión de usuarios.
- Diferenciar permisos por roles: `admin`, `investigador`, `publico`.
- Permitir que investigadores y administradores creen publicaciones.
- Adjuntar archivos multimedia o documentos a publicaciones.
- Editar y eliminar publicaciones propias.
- Dar "me gusta" a publicaciones desde la vista de detalle.
- Ordenar publicaciones por likes, jerarquía del autor y fecha.
- Administrar usuarios y publicaciones desde un panel de administrador.
- Editar perfil de usuario, incluyendo biografía, institución, teléfono, ubicación, sitio web y foto.
- Recuperar contraseñas olvidadas mediante correo y token temporal.
- Redirigir usuarios autenticados a sala virtual BigBlueButton.
- Redirigir usuarios autenticados a la herramienta externa de encuestas.

## Funcionamiento general

La app carga un frontend React desde `dist/`. Ese frontend llama a endpoints PHP bajo `api/`.

Flujo principal:

```text
Usuario
  -> Frontend React/Vite compilado en dist/
  -> API PHP en api/
  -> Base de datos MySQL
  -> Archivos en uploads/
```

En desarrollo existe un backend Node/Express en `server.ts`, pero el código actual y la documentación del proyecto indican que producción usa PHP.

## Tecnologías usadas

Frontend:

- React 19
- TypeScript
- Vite
- TailwindCSS v4 mediante `@tailwindcss/vite`
- `lucide-react` para iconos
- `motion/react` para animaciones

Backend producción:

- PHP
- PDO
- Sesiones PHP
- MySQL
- `mail()` de PHP para recuperación de contraseña

Backend local/legado:

- Node.js
- Express
- TypeScript con `tsx`
- MySQL con `mysql2`
- JWT con `jsonwebtoken`
- Cookies con `cookie-parser`
- Uploads con `multer`
- Hash de contraseñas con `bcryptjs`

Despliegue:

- Build con `vite build`
- Carpeta generada: `dist/`
- FTP automatizado con `basic-ftp` en `deploy-ftp.js`

Base de datos:

- MySQL
- Tablas principales: `usuarios`, `roles`, `permisos`, `usuarios_roles`, `roles_permisos`, `tipos_contenido`, `categorias`, `contenido`, `contenido_categorias`, `archivos`, `auditoria`, `usuarios_perfiles`, `password_resets`.

## Dónde se aloja

El sitio de producción documentado y usado por el proyecto es:

```text
https://investigacioneducativafccf.net/scidifucion/
```

El despliegue se realiza por FTP a Hostinger. El script `deploy-ftp.js` sube el contenido de `dist/` al directorio remoto:

```text
/scidifucion
```

URLs externas relacionadas:

```text
Sala virtual BBB:
https://bbb-test.investigacioneducativafccf.net/

Encuestas:
https://investigacioneducativafccf.net/disenador_instrumentos/
```

El `base` de Vite está configurado como:

```text
/scidifucion/
```

## Configuración y contraseñas usadas

Por seguridad, no se escriben aquí valores reales.

Tipos de secretos/configuración detectados:

- Contraseña de MySQL usada por PHP:
  - Ubicación: `public/api/config.php`
  - También queda copiada a `dist/api/config.php` después del build.
  - Observación: actualmente hay credenciales de base de datos escritas directamente en el archivo PHP. Conviene moverlas a variables de entorno si Hostinger lo permite.

- Credenciales de MySQL para Node/Express:
  - Ubicación esperada: `.env.local`
  - Variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

- Credenciales FTP para despliegue:
  - Ubicación esperada: `.env.local`
  - Variables: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
  - Usadas por `deploy-ftp.js`.

- Secreto JWT para backend Node/Express:
  - Ubicación esperada: `.env.local`
  - Variable: `JWT_SECRET`.
  - Nota: el backend PHP de producción usa sesiones PHP, no JWT.

- API key de Gemini:
  - Ubicación esperada: `.env.local`
  - Variable: `GEMINI_API_KEY`.
  - El proyecto la expone en build como `process.env.GEMINI_API_KEY`, aunque en la revisión del código principal no se observó una funcionalidad activa clara que la use en `src/App.tsx`.

- Configuración de correo para recuperación:
  - Variables esperadas: `APP_URL`, `MAIL_FROM`, `MAIL_FROM_NAME`.
  - Si no existen, PHP intenta inferir la URL base y usa valores por defecto para remitente.

- Contraseñas de usuarios:
  - Se guardan con `password_hash(..., PASSWORD_BCRYPT)` en PHP.
  - Login valida con `password_verify`.
  - Reset de contraseña vuelve a guardar la contraseña con bcrypt.

- Tokens de recuperación:
  - Se genera un token aleatorio con `random_bytes`.
  - En la base solo se guarda `hash('sha256', token)`.
  - Expiran en 1 hora y se invalidan al usarse.

## Backend PHP real

Endpoints de autenticación:

- `public/api/auth/register.php`: registra usuarios y evita auto-registro como admin.
- `public/api/auth/login.php`: valida email/password y crea `$_SESSION['user']`.
- `public/api/auth/me.php`: devuelve usuario y perfil si hay sesión.
- `public/api/auth/logout.php`: cierra sesión.
- `public/api/auth/profile.php`: actualiza perfil y foto.
- `public/api/auth/forgot-password.php`: crea token de recuperación y envía correo.
- `public/api/auth/reset-password.php`: valida token y cambia contraseña.

Endpoints de contenido:

- `public/api/contenido.php`: lista publicaciones, crea contenido, actualiza contenido propio, elimina contenido propio y maneja archivos adjuntos.
- `public/api/like.php`: alterna like/unlike de una publicación.

Endpoints admin:

- `public/api/admin/users.php`: lista usuarios, elimina usuarios y actualiza roles. Requiere rol `admin`.
- `public/api/admin/content.php`: lista publicaciones y permite eliminar publicaciones. Requiere rol `admin`.

## Frontend React

El frontend principal está concentrado en `src/App.tsx`.

Vistas principales:

- `home`: repositorio de publicaciones.
- `login`: inicio de sesión.
- `register`: registro.
- `forgot-password`: solicitud de recuperación por correo.
- `reset-password`: creación de nueva contraseña desde token.
- `create`: creación/edición de publicación.
- `admin`: panel administrativo.

Características UI:

- Tema claro/oscuro persistido en `localStorage`.
- Vista de publicaciones en grid o lista.
- Modal de detalles para leer publicación completa.
- Botón de like dentro del detalle.
- Header con acceso a repositorio, sala virtual, directorio, encuestas y panel admin.
- Perfil editable con foto.

## Base de datos

El archivo `database.sql` define el esquema base. La migración `migrations/001_password_resets.sql` agrega la tabla `password_resets` para bases ya existentes.

Observación importante:

- El código usa la tabla `contenido_likes`, pero `database.sql` no la define en la versión revisada. Si producción ya la tiene, funciona; si se instala desde cero con `database.sql`, faltaría agregar esa tabla.

## Despliegue

Flujo recomendado:

```bash
npm run lint
npm run build
```

Luego subir el contenido de `dist/` a Hostinger o ejecutar:

```bash
npm run deploy
```

El script `deploy-ftp.js` carga `.env.local` y usa las variables FTP.

## Riesgos y observaciones técnicas

- `public/api/config.php` contiene credenciales reales de base de datos en código. Esto funciona, pero es sensible si el repositorio se comparte.
- `dist/api/config.php` replica esas credenciales tras el build.
- `contenido_likes` está referenciada por PHP, Node y frontend, pero no existe en `database.sql`.
- `usuarios_perfiles` se crea tanto en `database.sql` como dinámicamente desde `me.php` y `profile.php`. Funciona, pero mezcla migraciones con creación en runtime.
- `server.ts` está avanzado, pero no parece ser el backend de producción.
- `README.md` y `/docs/IA` ya explican la arquitectura híbrida, pero hay detalles nuevos que no están uniformemente reflejados en todos los documentos.

## Comparación contra docs/IA

Archivos revisados:

- `docs/IA/continue.md`
- `docs/IA/pendientes.md`
- `docs/IA/mastercontext.md`
- `docs/IA/PRESENTACION_SCIDIFUSION.md`
- `docs/IA/historial de cambios.md`

### Coincidencias

- Es correcto que SciDifusión es una plataforma de divulgación científica/académica.
- Es correcto que el frontend usa React, Vite, TypeScript y TailwindCSS.
- Es correcto que producción usa PHP y MySQL en Hostinger.
- Es correcto que `server.ts` es backend Node/Express de desarrollo o legado, no producción principal.
- Es correcto que el despliegue usa FTP y `dist/`.
- Es correcto que existen autenticación, registro, roles, panel admin, subida de archivos y sala virtual BBB.
- Es correcto que los formatos soportados para publicaciones son PDF, JPG, PNG, WebP, MP3, WAV y MP4 con límite de 20 MB.
- Es correcto que existe sistema de likes con orden por likes, rol y fecha.
- Es correcto que existe recuperación de contraseña por correo con tabla `password_resets`.
- Es correcto que el botón de "Encuestas" aparece para usuarios logueados.

### Diferencias o puntos desactualizados

- `docs/IA/continue.md` dice que el `README.md` contiene texto de plantilla y debe reescribirse. Eso ya no es cierto en la revisión actual: el README ya fue reescrito con información del proyecto y recuperación de contraseña.

- `docs/IA/mastercontext.md` indica leer `skills.md`, `architecture.md`, `deployment.md` y `ai_context.md`, pero esos archivos no existen dentro de `docs/IA` en la revisión actual.

- `docs/IA/PRESENTACION_SCIDIFUSION.md` describe 3 niveles de permisos, pero el sistema real maneja cuatro estados conceptuales: invitado/no autenticado, `publico`, `investigador` y `admin`.

- `docs/IA/PRESENTACION_SCIDIFUSION.md` no menciona funcionalidades ya existentes como perfil extendido, foto de perfil, likes, panel admin detallado, encuestas ni recuperación de contraseña.

- `docs/IA/historial de cambios.md` termina en la implementación de uploads y recomienda probar adjuntos; el proyecto actual ya tiene avances posteriores: likes, panel admin, perfil, encuestas y recuperación de contraseña.

- `docs/IA/pendientes.md` marca como completadas tareas de panel admin, roles y enlace a encuestas; eso coincide, pero el archivo no refleja pendientes actuales como documentar `contenido_likes`, sanear credenciales en PHP o unificar migraciones.

- `docs/IA/continue.md` afirma que la recuperación resolvió timezones delegando expiración a MySQL con `DATE_ADD(NOW(), INTERVAL 1 HOUR)`. Esto sí coincide con el endpoint PHP actual `forgot-password.php`; sin embargo, `migrations/001_password_resets.sql` solo crea la tabla y no documenta la tabla `contenido_likes`, que también es necesaria para una instalación limpia.

- La documentación presenta el backend Node como legado correctamente, pero `server.ts` todavía contiene rutas funcionales y dependencias completas. Esto puede confundir si alguien ejecuta `npm run dev`, porque ese script arranca `server.ts`, no solo Vite puro.

### Conclusión sobre docs/IA

La documentación de `/docs/IA` es mayormente cierta en arquitectura y propósito, pero está parcialmente desactualizada. El punto más importante a corregir es que `mastercontext.md` referencia archivos inexistentes y que `database.sql` no define `contenido_likes`, aunque la documentación y el código ya dependen de esa tabla.
