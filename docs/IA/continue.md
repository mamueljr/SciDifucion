# SciDifusión - Proyecto y Estado Actual

Este archivo `continue.md` sirve como punto de partida y contexto general para cualquier desarrollador o asistente de IA (AI Assistant) que trabaje en el proyecto. Proporciona una visión clara de qué es la plataforma, cómo está construida y en qué estado se encuentra.
Documento maestro de continuidad del proyecto
Última actualización: 12 Mayo 2026

## 1. Descripción del Proyecto
**SciDifusión** es una plataforma digital orientada a la divulgación científica, académica y educativa. El sistema permite a investigadores, docentes y administradores publicar contenido multimedia y académico dentro de un entorno centralizado y moderno.

La plataforma está siendo desarrollada como una solución institucional adaptable para:

*   Divulgación científica,
*   Repositorios académicos,
*   Contenido multimedia,
*   Integración educativa,
*   Herramientas virtuales de colaboración.

## 2. Estado Actual del proyecto
El proyecto actualmente se encuentra en una etapa funcional avanzada.

Ya existe:

frontend funcional desplegado públicamente,
autenticación,
sistema RBAC,
backend operativo,
integración de archivos,
integración con BigBlueButton,
y despliegue real en producción.

El sistema dejó de ser un prototipo experimental y actualmente funciona como una plataforma institucional en evolución.

## 3. Arquitectura y Tecnologías
El proyecto comenzó con un backend en Node.js/Express, pero debido a los requisitos de despliegue en Hostinger (entorno compartido), la arquitectura actual de producción utiliza **PHP**.

*   **Frontend**: React + Vite + TypeScript + Tailwind CSS (Diseño Dark Mode).
*   **Backend (Producción)**: PHP (scripts en `/public/api/`).
*   **Backend (Desarrollo/Legado)**: Node.js + Express (archivo `server.ts`). *Nota: No se utiliza en producción.*
*   **Base de Datos**: MySQL.
*   **Despliegue**: FTP automatizado (`deploy-ftp.js`) hacia Hostinger (`https://investigacioneducativafccf.net/scidifucion/`).


## 4. Estructura Principal del Proyecto
*   `/src/`: Contiene todo el código fuente del frontend en React (componentes, vistas, lógica de UI).
*   `/public/api/`: Contiene los scripts backend en PHP que manejan la lógica de negocio (autenticación, subida de contenidos, conexión a DB).
*   `/public/uploads/`: Carpeta física donde se guardan los archivos adjuntos.
*   `server.ts`: Archivo del backend Node.js (actualmente en desuso para producción).
*   `database.sql`: Estructura y esquema de la base de datos MySQL.
*   `deploy-ftp.js`: Script en Node para desplegar la carpeta `dist/` vía FTP al servidor remoto.

## 5. Estado Actual (Últimos Avances)
*   **Autenticación**: Registro e inicio de sesión funcional con control de roles e integrando PHP en el servidor remoto.
*   **Gestión de Contenido**: Los investigadores pueden crear publicaciones y adjuntar archivos (hasta 20 MB).
*   **Tipos de Archivos Soportados**: `PDF`, `JPG`, `PNG`, `WebP`, `MP3`, `WAV`, `MP4`.
*   **Sala Virtual**: Recientemente se implementó un control de acceso para la Sala Virtual, que valida si el usuario tiene sesión iniciada antes de redirigirlo a `https://bbb-test.investigacioneducativafccf.net/`.

## 6. Tareas Pendientes / Posibles Mejoras (Roadmap)
- [ ] **Limpieza de Documentación**: El archivo `README.md` actual contiene texto de plantilla (boilerplate de AI Studio) que no corresponde al proyecto. Debe ser reescrito.
- [ ] **Validación de Archivos en Interfaz**: Comprobar desde la interfaz (UI) una publicación real con archivo y confirmar que la visualización y descarga funcionen correctamente.
- [ ] **Separación de Entornos**: Limpiar o documentar claramente la coexistencia del entorno Node.js (`server.ts`) y PHP para evitar confusiones futuras.
- [ ] **Gestión de Usuarios (Admin)**: Asegurar que el rol de administrador tenga vistas para gestionar (aprobar/eliminar) investigadores y publicaciones.

## 7. Instrucciones para Continuar
Si eres un asistente de IA o un nuevo desarrollador:
1. Revisa siempre los archivos en `public/api/` para lógica de backend, ya que el proyecto se ejecuta remotamente en PHP.
2. Si realizas cambios en React (`/src/`), asegúrate de correr `npm run build` y luego `npm run deploy` para reflejarlos en Hostinger.
3. Para probar localmente, puedes usar `npm run dev` para el frontend de Vite.
