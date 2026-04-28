# Historial de Cambios

## Fecha

2026-04-28

## Resumen General

Se implementó soporte para subida de archivos en SciDifusión, se adaptó el flujo para que funcionara tanto en el backend local con `Express/TypeScript` como en el entorno remoto basado en `PHP`, y se realizó el despliegue por FTP al servidor.

## Cambios Realizados

### 1. Análisis inicial del proyecto

- Se revisó la estructura general del repositorio.
- Se identificó que el proyecto tiene:
  - frontend en `React + Vite + Tailwind`
  - backend local en `Express + TypeScript`
  - endpoints remotos en `PHP`
  - base de datos MySQL con una tabla `archivos` ya prevista para adjuntos
- Se detectó que originalmente la app no permitía subir archivos reales, solo contenido textual.

### 2. Implementación de uploads en backend Node

Se actualizó [server.ts](/home/emmanuel/Documentos/GitHub/SciDifucion/server.ts) para:

- agregar soporte a subida de archivos con `multer`
- validar tipos MIME permitidos
- limitar tamaño máximo a `20 MB`
- guardar archivos físicamente en `public/uploads`
- exponer los archivos desde la ruta `/uploads`
- registrar metadatos del archivo en la tabla `archivos`
- relacionar el archivo con el registro de `contenido`
- devolver errores claros cuando el archivo no cumple formato o tamaño

### 3. Tipos de archivo habilitados

Se habilitaron estos formatos:

- `PDF`
- `JPG`
- `PNG`
- `WebP`
- `MP3`
- `WAV`
- `MP4`

Estos formatos se eligieron como primer conjunto seguro y útil para una plataforma académica.

### 4. Integración inicial del frontend para adjuntos

Se actualizó [src/App.tsx](/home/emmanuel/Documentos/GitHub/SciDifucion/src/App.tsx) para:

- permitir seleccionar un archivo en el formulario de publicación
- enviar los datos como `FormData`
- mandar `titulo`, `cuerpo`, `tipo_id`, `estado` y `archivo`
- mostrar un enlace al adjunto en las tarjetas del contenido publicado
- reiniciar el formulario después de una publicación exitosa

### 5. Ajuste de arquitectura para entorno remoto

Durante el trabajo se detectó que el hosting remoto actual no ejecuta `server.ts`, sino los endpoints `PHP` dentro de `public/api`.

Por eso se hizo una adaptación para que la versión desplegable use el backend remoto existente:

- se restauró el frontend para apuntar a rutas `PHP`
- se ajustó `API_PREFIX` en [src/App.tsx](/home/emmanuel/Documentos/GitHub/SciDifucion/src/App.tsx)
- se mantuvo la compatibilidad con la base `/scidifucion/`

### 6. Implementación de uploads en backend PHP

Se actualizó [public/api/contenido.php](/home/emmanuel/Documentos/GitHub/SciDifucion/public/api/contenido.php) para:

- aceptar `multipart/form-data`
- leer campos desde `$_POST`
- recibir archivos desde `$_FILES`
- validar tamaño máximo de `20 MB`
- validar tipos MIME permitidos con `finfo`
- crear la carpeta `uploads` si no existe
- mover físicamente el archivo al servidor
- guardar ruta, nombre original, MIME type y tamaño en la tabla `archivos`
- incluir la información del adjunto en el listado público de contenido
- usar transacciones para no dejar registros huérfanos si algo falla

### 7. Carpeta física de almacenamiento

Se definió que los archivos se guardarán en una sola carpeta:

- local: `public/uploads`
- remoto desplegado: `/public_html/scidifucion/uploads`

No se separaron por usuario en esta versión.

También se añadió:

- [public/uploads/.gitkeep](/home/emmanuel/Documentos/GitHub/SciDifucion/public/uploads/.gitkeep)

para asegurar que la carpeta viaje en el `build` y en el despliegue.

### 8. Dependencias añadidas

Se añadieron dependencias en [package.json](/home/emmanuel/Documentos/GitHub/SciDifucion/package.json):

- `multer`
- `@types/multer`

También se actualizó `package-lock.json`.

### 9. Verificación técnica

Se ejecutaron estas verificaciones:

- `npm run lint`
- `npm run build`

Ambas quedaron correctas después de ajustar el uso de rutas relativas en el frontend.

### 10. Despliegue al servidor

Se ejecutó:

```bash
npm run deploy
```

El despliegue fue exitoso por FTP hacia Hostinger.

Se subieron correctamente:

- `dist/index.html`
- `dist/assets/*`
- `dist/api/*`
- `dist/uploads/.gitkeep`

### 11. Validación remota

Se comprobó que el sitio remoto responde en:

- `https://investigacioneducativafccf.net/scidifucion/`

También se verificó que el endpoint:

- `https://investigacioneducativafccf.net/scidifucion/api/contenido.php`

responde correctamente.

## Estado Actual

La aplicación ya permite:

- registrar usuarios
- iniciar sesión
- publicar contenido
- adjuntar archivos compatibles
- guardar esos archivos en el servidor remoto
- registrar su metadata en base de datos
- mostrar el enlace al adjunto en el listado público

## Observaciones

- El backend `Node/Express` quedó avanzado localmente, pero el entorno de producción actual está usando `PHP`.
- La carpeta de archivos está centralizada y no segmentada por usuario.
- El siguiente paso recomendable es probar desde la interfaz una publicación real con archivo y confirmar visualización y descarga.
