# SciDifusión - Proyecto y Estado Actual

Documento maestro de continuidad del proyecto.

Última actualización: 17 Mayo 2026

Este archivo `continue.md` sirve como punto de partida para cualquier desarrollador o asistente de IA que trabaje en SciDifusión. Resume qué es la plataforma, cómo está construida, qué funciona actualmente y qué puntos deben cuidarse antes de continuar.

## 1. Descripción del Proyecto

**SciDifusión** es una plataforma digital de divulgación científica, académica y educativa. Funciona como repositorio institucional para publicar, organizar y consultar contenido académico con soporte para archivos multimedia.

La plataforma está pensada para:

- Divulgación científica.
- Repositorios académicos.
- Publicación de artículos y recursos multimedia.
- Integración educativa.
- Herramientas virtuales de colaboración.

## 2. Estado Actual del Proyecto

El proyecto se encuentra en etapa funcional avanzada y ya opera en producción.

Ya existe:

- Frontend funcional desplegado públicamente.
- Registro e inicio de sesión.
- Recuperación de contraseña por correo.
- Control de acceso por roles.
- Backend PHP operativo.
- Base de datos MySQL.
- Gestión de publicaciones.
- Subida y consulta de archivos adjuntos.
- Perfil extendido de usuario con foto.
- Panel de administración.
- Sistema de "Me gusta".
- Integración con BigBlueButton.
- Enlace a herramienta externa de encuestas.
- Despliegue real por FTP hacia Hostinger.

El sistema ya no debe tratarse como prototipo: es una plataforma institucional en evolución.

## 3. Arquitectura y Tecnologías

El proyecto comenzó con un backend en Node.js/Express, pero por compatibilidad con Hostinger en entorno compartido la arquitectura de producción utiliza **PHP**.

### Producción

- **Frontend**: React + Vite + TypeScript + TailwindCSS.
- **Backend**: PHP en `/public/api/`.
- **Base de datos**: MySQL.
- **Autenticación**: sesiones PHP.
- **Contraseñas de usuarios**: `password_hash` y `password_verify` con bcrypt.
- **Recuperación de contraseña**: token aleatorio, hash SHA-256 en MySQL y envío por `mail()`.
- **Uploads**: carpeta `uploads/`.
- **Despliegue**: carpeta `dist/` subida por FTP a Hostinger.

### Desarrollo / Legado

- **Backend Node**: `server.ts`.
- **Framework**: Express.
- **Auth Node**: JWT con cookies.
- **Uploads Node**: Multer.
- **Base Node**: `mysql2`.

Nota importante: `server.ts` contiene lógica funcional, pero no es el backend principal de producción.

## 4. URLs y Alojamiento

Sitio principal:

```text
https://investigacioneducativafccf.net/scidifucion/
```

Sala virtual BBB:

```text
https://bbb-test.investigacioneducativafccf.net/
```

Encuestas:

```text
https://investigacioneducativafccf.net/disenador_instrumentos/
```

El despliegue usa `deploy-ftp.js`, que sube `dist/` al directorio remoto:

```text
/scidifucion
```

Vite está configurado con:

```text
base: /scidifucion/
```

## 5. Estructura Principal del Proyecto

- `/src/`: frontend React, vistas y lógica de interfaz.
- `/public/api/`: backend PHP de producción.
- `/public/uploads/`: carpeta local de archivos subidos.
- `/dist/`: build de producción que se sube a Hostinger.
- `/migrations/`: scripts SQL incrementales para bases existentes.
- `server.ts`: backend Node/Express de desarrollo o legado.
- `database.sql`: esquema base de MySQL.
- `deploy-ftp.js`: despliegue FTP de `dist/`.
- `resumencodex.md`: resumen técnico amplio generado tras revisar el proyecto y contrastar `/docs/IA`.

## 6. Funcionalidades Actuales

### Autenticación

- Registro con nombre, correo, contraseña y rol.
- El registro bloquea auto-registro como `admin`.
- Login con sesión PHP.
- Logout.
- Perfil de usuario.
- Recuperación de contraseña por correo.

### Roles

Roles reales/conceptuales:

- `invitado`: usuario no autenticado, acceso público de lectura.
- `publico`: usuario autenticado básico; en UI se muestra como "Usuario".
- `investigador`: puede crear publicaciones.
- `admin`: acceso al panel administrativo y control total.

### Contenido

- Lista pública de publicaciones.
- Investigadores y administradores pueden crear contenido.
- Autores pueden editar y eliminar sus propias publicaciones.
- Administradores pueden gestionar publicaciones desde panel.
- Estados soportados: `publicado`, `borrador`, `archivado`.
- El frontend usa principalmente `publicado` y `borrador`.

### Archivos

Formatos soportados:

- PDF.
- JPG.
- PNG.
- WebP.
- MP3.
- WAV.
- MP4.

Límite actual:

```text
20 MB por archivo adjunto de publicación.
5 MB para foto de perfil.
```

### Perfil

El perfil permite:

- Nombre.
- Biografía.
- Institución.
- Teléfono.
- Ubicación.
- Sitio web.
- Foto de perfil.

La tabla `usuarios_perfiles` existe en `database.sql`, y además `me.php` y `profile.php` la crean dinámicamente si no existe.

### Panel Admin

Disponible solo para `admin`.

Permite:

- Listar usuarios.
- Eliminar usuarios.
- Cambiar roles.
- Listar publicaciones.
- Eliminar publicaciones.

### Likes y Ordenamiento

El sistema usa `contenido_likes`.

El muro ordena por:

1. Cantidad de likes.
2. Jerarquía del autor: `admin` > `investigador` > `publico`.
3. Fecha de creación.

El botón interactivo de "Me gusta" está en la vista de detalles para evitar clics accidentales.

### Recuperación de Contraseña

Flujo implementado:

1. Usuario abre "Olvidé mi contraseña".
2. API crea token aleatorio con `random_bytes`.
3. Se guarda solo `hash('sha256', token)` en `password_resets`.
4. El token expira en 1 hora usando `DATE_ADD(NOW(), INTERVAL 1 HOUR)` desde MySQL.
5. Se envía enlace por correo usando PHP `mail()`.
6. El usuario abre `?reset_token=...`.
7. Define nueva contraseña.
8. El token queda invalidado.

Para bases existentes, ejecutar:

```text
migrations/001_password_resets.sql
```

## 7. Base de Datos

Tablas definidas en `database.sql`:

- `usuarios`
- `password_resets`
- `roles`
- `permisos`
- `roles_permisos`
- `usuarios_roles`
- `tipos_contenido`
- `categorias`
- `contenido`
- `contenido_categorias`
- `archivos`
- `auditoria`
- `usuarios_perfiles`

Observación importante:

- El código PHP y Node usan `contenido_likes`, pero `database.sql` no define esa tabla en la revisión actual. Si producción ya la tiene, la funcionalidad trabaja. Para una instalación limpia, falta agregar una migración o actualizar `database.sql`.

## 8. Configuración y Secretos

No copiar secretos reales en documentación.

Tipos de secretos usados:

- Credenciales MySQL de PHP en `public/api/config.php`.
- Credenciales MySQL Node en `.env.local`.
- Credenciales FTP en `.env.local`.
- `JWT_SECRET` para backend Node.
- `GEMINI_API_KEY`.
- `APP_URL`, `MAIL_FROM`, `MAIL_FROM_NAME` para recuperación de contraseña.

Notas:

- `public/api/config.php` actualmente contiene credenciales de base de datos directamente en código.
- Después de `npm run build`, esas credenciales también quedan copiadas en `dist/api/config.php`.
- Si Hostinger lo permite, conviene migrar esos datos a variables de entorno o a un archivo fuera del webroot.

## 9. Despliegue

Flujo recomendado:

```bash
npm run lint
npm run build
```

Luego subir `dist/` a Hostinger o usar:

```bash
npm run deploy
```

Notas:

- `npm run lint` ejecuta `tsc --noEmit`.
- `npm run build` genera `dist/`.
- `npm run deploy` ejecuta build y luego sube por FTP.

## 10. Tareas Pendientes / Posibles Mejoras

- [ ] Agregar definición/migración de `contenido_likes` para instalaciones limpias.
- [ ] Revisar si las credenciales de `public/api/config.php` pueden moverse fuera del código versionado.
- [ ] Unificar estrategia de migraciones: evitar mezclar `database.sql` con tablas creadas en runtime.
- [ ] Documentar con claridad que `npm run dev` arranca `server.ts`, no solo un Vite puro.
- [ ] Revisar `docs/IA/mastercontext.md`, porque referencia `skills.md`, `architecture.md`, `deployment.md` y `ai_context.md`, pero esos archivos no existen en `docs/IA`.
- [ ] Actualizar `PRESENTACION_SCIDIFUSION.md` con funciones recientes: likes, perfil extendido, panel admin, encuestas y recuperación de contraseña.
- [ ] Probar periódicamente en producción el envío real de correos con `mail()` de Hostinger.

## 11. Instrucciones para Continuar

Si eres un asistente de IA o un nuevo desarrollador:

1. Revisa primero `public/api/`, porque producción usa PHP.
2. Revisa `src/App.tsx`, porque ahí vive la mayoría de la interfaz.
3. No asumas que `server.ts` es producción.
4. Si modificas React, ejecuta `npm run lint` y `npm run build`.
5. Si cambias backend PHP, asegúrate de que el archivo también llegue a `dist/api/` mediante build o subida manual.
6. Si agregas tablas, crea migración en `/migrations/` además de actualizar `database.sql` cuando aplique.
7. No documentes secretos reales; usa nombres de variables o valores redactados.
