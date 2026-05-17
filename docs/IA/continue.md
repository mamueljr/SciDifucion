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
- Las tarjetas muestran conteo de likes y comentarios.
- El repositorio tiene búsqueda real contra la API por título, cuerpo, autor y tipo.
- El listado usa paginación desde `public/api/contenido.php` con 9 publicaciones por página.
- Se puede filtrar el repositorio por categoría.
- Al crear o editar publicaciones se puede asignar una categoría.
- Las tarjetas muestran la categoría principal como etiqueta cuando existe.
- Las tarjetas y detalles muestran la foto de perfil del autor si existe; si no, usan el avatar genérico.

### Categorías

El sistema usa `categorias` y `contenido_categorias`.

Comportamiento actual:

- Las categorías se consultan desde `public/api/categories.php`.
- `public/api/config.php` incluye `ensureCategoriesReady()` para crear tablas y sembrar categorías base si no existen.
- Existe migración formal en `migrations/003_categories_seed.sql`.
- Categorías base: Educación, Tecnología, Ciencias Sociales, Salud, Inteligencia Artificial e Investigación Educativa.

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
- ORCID.
- Líneas de investigación.
- Foto de perfil.

La tabla `usuarios_perfiles` existe en `database.sql`, y además `me.php` y `profile.php` la crean dinámicamente si no existe.

### Perfiles Académicos Públicos

El sistema usa `public/api/author.php` para mostrar información académica del autor desde la vista de detalles.

Comportamiento actual:

- En el perfil editable se pueden guardar ORCID y líneas de investigación.
- El ORCID se valida con formato `0000-0000-0000-0000`.
- La vista de detalles muestra el botón discreto `Ver perfil académico`.
- El perfil académico del autor se carga y despliega solo cuando el usuario pulsa ese botón.
- El bloque académico puede mostrar foto, institución, biografía, ORCID, sitio web y líneas de investigación.
- La vista de detalles lista hasta 6 publicaciones públicas recientes del autor.
- `public/api/config.php` incluye `ensureUserProfilesTable()` para crear la tabla y agregar columnas académicas si faltan.
- Existe migración formal en `migrations/004_academic_profile_fields.sql`.

### Panel Admin

Disponible solo para `admin`.

Permite:

- Listar usuarios.
- Eliminar usuarios.
- Cambiar roles.
- Listar publicaciones.
- Eliminar publicaciones.

En móvil, las tablas del panel usan scroll horizontal para conservar columnas y acciones sin romper el layout.

### Responsive Móvil

El frontend ya cuenta con ajustes responsive principales en `src/App.tsx`.

Comportamiento actual:

- Header compacto en teléfono.
- Menú móvil con botón `Menu/X`.
- En móvil se muestran accesos a Repositorio, Sala Virtual, Directorio, Encuestas, Panel, Login/Registro o Cerrar sesión según estado de sesión y rol.
- Acciones principales del home se acomodan con `flex-wrap`.
- Tarjetas del repositorio usan menor padding en pantallas pequeñas.
- Formulario de creación/edición acomoda botones en columna en móvil.
- Modal de detalles y comentarios se presenta como panel inferior en teléfono, con padding reducido.
- Tablas del panel admin usan `overflow-x-auto` y ancho mínimo para scroll horizontal.

### Likes y Ordenamiento

El sistema usa `contenido_likes`.

El muro ordena por:

1. Cantidad de likes.
2. Jerarquía del autor: `admin` > `investigador` > `publico`.
3. Fecha de creación.

El botón interactivo de "Me gusta" está en la vista de detalles para evitar clics accidentales.

### Comentarios

El sistema usa `contenido_comentarios`.

Comportamiento actual:

- Los comentarios se consultan desde `public/api/comments.php`.
- Usuarios invitados pueden ver comentarios desde la vista de detalles.
- Usuarios autenticados pueden publicar comentarios desde la vista de detalles.
- Cada comentario muestra nombre del usuario autor y fecha/hora.
- El frontend limita comentarios a 1000 caracteres.
- `public/api/contenido.php` incluye `comments_count` para mostrar el contador en tarjetas y detalles.
- `public/api/config.php` incluye `ensureContentCommentsTable()` para crear la tabla si aún no existe en producción.
- Existe migración formal en `migrations/002_content_comments.sql`.

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
- `contenido_likes`
- `contenido_comentarios`
- `archivos`
- `auditoria`
- `usuarios_perfiles`

Observación importante:

- `database.sql` ya define `contenido_likes` y `contenido_comentarios` para instalaciones limpias.
- Para bases existentes, los comentarios también pueden prepararse con `migrations/002_content_comments.sql`; además la API PHP intenta crear `contenido_comentarios` en runtime si no existe.
- Para bases existentes, las categorías también pueden prepararse con `migrations/003_categories_seed.sql`; además la API PHP intenta crear `categorias` y `contenido_categorias` en runtime si no existen.
- Para bases existentes, los campos académicos de perfil también pueden prepararse con `migrations/004_academic_profile_fields.sql`; además la API PHP intenta agregar `orcid` y `lineas_investigacion` en runtime si no existen.

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

### Prioridad Alta

- [ ] Revisar si las credenciales de `public/api/config.php` pueden moverse fuera del código versionado. Actualmente la contraseña de MySQL queda en PHP y se copia a `dist/api/config.php`.
- [ ] Unificar estrategia de migraciones: evitar mezclar `database.sql`, scripts en `/migrations` y tablas creadas en runtime desde PHP.
- [ ] Mejorar seguridad de sesiones PHP: revisar cookies `HttpOnly`, `Secure`, `SameSite` y limitar CORS, porque actualmente `Access-Control-Allow-Origin` está abierto.
- [ ] Probar y robustecer recuperación de correo. El flujo existe, pero depende de `mail()` en Hostinger; si falla, considerar SMTP autenticado.

### Prioridad Media

- [ ] Separar mejor los scripts de desarrollo para no confundir backend PHP de producción con `server.ts`. Por ejemplo: `dev:node` para Express y documentación clara de build/despliegue.
- [ ] Agregar validaciones frontend para tamaño de archivo, tipos permitidos, contraseñas y mensajes de error más claros antes de enviar al servidor.
- [ ] Mejorar panel admin: activar/desactivar usuarios, búsqueda, filtros, paginación y confirmaciones más completas para acciones destructivas.
- [ ] Revisar responsive con usuarios reales en varios teléfonos y ajustar detalles finos de espaciado, textos largos o tablas si aparecen casos extremos.
- [ ] Revisar `docs/IA/mastercontext.md`, porque referencia `skills.md`, `architecture.md`, `deployment.md` y `ai_context.md`, pero esos archivos no existen en `docs/IA`.
- [ ] Crear o completar documentación faltante en `/docs/IA`: `architecture.md`, `deployment.md`, `ai_context.md` y una guía breve para producción.
- [ ] Crear proceso de backup/export de base de datos antes de cambios grandes o migraciones.

### Prioridad Baja / Valor Futuro

- [x] Agregar paginación y búsqueda real en el repositorio para cuando crezca el volumen de publicaciones.
- [x] Integrar categorías funcionales en la UI, ya que existen tablas relacionadas pero no una experiencia completa.
- [x] Mejorar perfiles académicos con campos como ORCID, líneas de investigación y publicaciones del autor.
- [ ] Usar la tabla `auditoria` para registrar acciones importantes: login, creación, edición, eliminación, cambio de rol y recuperación de contraseña.
- [ ] Actualizar `PRESENTACION_SCIDIFUSION.md` con funciones recientes: likes, comentarios, perfil extendido, panel admin, encuestas y recuperación de contraseña.
- [ ] Preparar una versión estable 1.1 con changelog, tag de GitHub y lista de verificación de producción.

## 11. Punto de Control Actual

Estado validado tras las últimas mejoras:

- Comentarios funcionando en detalles, visibles para invitados y publicables solo por usuarios autenticados.
- Sitio adaptado a móvil con header compacto, menú `Menu/X`, modal de detalles responsive y tablas admin con scroll horizontal.
- Repositorio con búsqueda real desde API, paginación de 9 publicaciones por página y filtro por categoría.
- Categorías funcionales con endpoint `public/api/categories.php`, selector al crear/editar y etiqueta en tarjetas.
- Perfiles académicos extendidos con ORCID y líneas de investigación.
- Perfil académico del autor disponible bajo demanda desde detalles con botón `Ver perfil académico`; no se muestra automáticamente.
- Tarjetas y detalles muestran foto de perfil del autor si existe; si no, conservan el avatar genérico.
- Migraciones nuevas disponibles:
  - `migrations/002_content_comments.sql`
  - `migrations/003_categories_seed.sql`
  - `migrations/004_academic_profile_fields.sql`
- `database.sql` actualizado para instalaciones limpias.
- Las APIs PHP crean o preparan tablas auxiliares en runtime cuando aplica.
- Últimas verificaciones ejecutadas correctamente: `npm run lint` y `npm run build`.

Este punto es buen candidato para commit de control antes de seguir con auditoría, seguridad de sesiones, documentación mayor o panel admin avanzado.

## 12. Instrucciones para Continuar

Si eres un asistente de IA o un nuevo desarrollador:

1. Revisa primero `public/api/`, porque producción usa PHP.
2. Revisa `src/App.tsx`, porque ahí vive la mayoría de la interfaz.
3. No asumas que `server.ts` es producción.
4. Si modificas React, ejecuta `npm run lint` y `npm run build`.
5. Si cambias backend PHP, asegúrate de que el archivo también llegue a `dist/api/` mediante build o subida manual.
6. Si agregas tablas, crea migración en `/migrations/` además de actualizar `database.sql` cuando aplique.
7. No documentes secretos reales; usa nombres de variables o valores redactados.
