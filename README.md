# SciDifusión

> Plataforma de divulgación científica y académica desarrollada para la Facultad de Ciencias de la Cultura Física y proyectos educativos relacionados.

---

# Descripción General

**SciDifusión** es una plataforma digital orientada a la publicación, organización y difusión de contenido académico y científico.

El sistema está diseñado para permitir a:
- investigadores,
- docentes,
- administradores,
- y usuarios académicos,

gestionar publicaciones, archivos multimedia y recursos educativos dentro de una infraestructura moderna y escalable.

La plataforma combina tecnologías modernas de frontend con un backend híbrido adaptado a infraestructura institucional y hosting compartido.

---

# Estado del Proyecto

Actualmente el proyecto se encuentra en una etapa funcional avanzada.

## Funcionalidades implementadas

- Sistema de autenticación
- Recuperación de contraseña por correo
- Control de acceso basado en roles (RBAC)
- Gestión de publicaciones
- Subida de archivos multimedia
- Integración con MySQL
- Panel administrativo básico
- Integración con BigBlueButton (BBB)
- Frontend React moderno
- Despliegue en producción

---

# URLs del Proyecto

## Plataforma principal
https://investigacioneducativafccf.net/scidifucion/

## Sala Virtual BBB
https://bbb-test.investigacioneducativafccf.net/

---

# Arquitectura del Proyecto

Actualmente SciDifusión utiliza una arquitectura híbrida debido a limitaciones y compatibilidad de infraestructura.

---

## Frontend

Tecnologías principales:
- React 19
- Vite
- TypeScript
- TailwindCSS v4

---

## Backend Producción

Tecnologías:
- PHP
- MySQL

Ubicación:
```text
/public/api/
```

Este backend es el que actualmente opera en producción.

### Recuperación de contraseña

El login permite recuperar contraseña por correo mediante un token temporal de un solo uso.

Flujo:
- El usuario usa `Olvidé mi contraseña`.
- La API crea un token seguro, guarda solo su hash en `password_resets` y envía un enlace al correo registrado.
- El enlace abre la app con `?reset_token=...`.
- El usuario define una nueva contraseña y el token queda invalidado.

Configuración requerida en producción:
```text
APP_URL="https://investigacioneducativafccf.net/scidifucion"
MAIL_FROM="no-reply@investigacioneducativafccf.net"
MAIL_FROM_NAME="SciDifusion"
```

Para bases ya existentes, ejecutar:
```sql
source migrations/001_password_resets.sql;
```

El servidor PHP debe tener envío de correo habilitado para `mail()`. En hosting compartido normalmente se configura desde el panel del proveedor.

---

## Backend Original / Legacy

Tecnologías:
- Node.js
- Express
- JWT
- Multer
- mysql2

Archivo principal:
```text
/server.ts
```

> IMPORTANTE:
> El backend Node.js NO es actualmente el backend principal de producción, pero contiene gran parte de la arquitectura original y lógica avanzada del sistema.

---

# Arquitectura General

```text
Usuario
   ↓
Frontend React/Vite
   ↓
API PHP
   ↓
MySQL
```

---

# Sistema RBAC

El proyecto implementa control de acceso basado en roles y permisos.

## Estructura detectada

- usuarios
- roles
- permisos
- usuarios_roles
- roles_permisos

## Roles principales

### Invitado
- Acceso público

### Usuario
- Inicio de sesión
- Acceso básico

### Investigador
- Crear publicaciones
- Subir archivos
- Gestionar contenido

### Administrador
- Gestión total del sistema
- Administración de usuarios
- Moderación y estadísticas

---

# Gestión de Archivos

Actualmente el sistema soporta:

- PDF
- JPG
- PNG
- WebP
- MP3
- WAV
- MP4

Características:
- Validación MIME
- Límites de tamaño
- Sanitización
- Upload seguro
- Asociación con publicaciones

---

# Integración BigBlueButton (BBB)

La plataforma cuenta con integración funcional con BigBlueButton para videoconferencias y espacios virtuales educativos.

Características actuales:
- Acceso autenticado
- Redirección controlada
- Protección básica mediante sesión

---

# Estructura General del Proyecto

```text
/
├── src/                    # Frontend React
├── public/
│   ├── api/                # Backend PHP producción
│   └── uploads/            # Archivos multimedia
│
├── server.ts               # Backend Node.js original
├── deploy-ftp.js           # Deploy automatizado
├── database.sql            # Base de datos
├── package.json
└── docs/
    └── ai/
```

---

# Instalación Local

## Requisitos

- Node.js
- npm
- MySQL

---

## Clonar repositorio

```bash
git clone https://github.com/mamueljr/SciDifucion.git
cd SciDifucion
```

---

## Instalar dependencias

```bash
npm install
```

---

## Ejecutar entorno desarrollo

```bash
npm run dev
```

---

## Compilar producción

```bash
npm run build
```

---

# Despliegue

Actualmente el despliegue se realiza mediante:
- FTP
- Hostinger
- Script automatizado

Comando:
```bash
npm run deploy
```

Archivo principal:
```text
deploy-ftp.js
```

---

# Problemas Conocidos

- Hostinger limita aplicaciones Node.js persistentes
- Coexistencia parcial entre Node.js y PHP
- Algunas rutas legacy aún existen
- README histórico desactualizado
- Arquitectura híbrida en transición

---

# Roadmap

## Prioridad Alta

- Mejorar panel administrativo
- Limpieza arquitectónica
- Consolidar backend producción
- Mejorar uploads
- Gestión avanzada de investigadores

## Prioridad Media

- Mejorar responsive
- Refactor API
- Paginación
- Mejoras de seguridad

## Futuro

- Revisión por pares
- Estadísticas académicas
- IA para resúmenes automáticos
- Streaming educativo
- Sistema de categorías
- API REST formal
- Migración futura a infraestructura VPS/Docker

---

# Convenciones del Proyecto

## Nombre oficial visual
```text
SciDifusión
```

## Nombre técnico recomendado
```text
scidifusion
```

## Nombre histórico actual
```text
scidifucion
```

> La variante `scidifucion` se mantiene actualmente por compatibilidad con despliegue y rutas existentes.

---

# Documentación IA

El proyecto utiliza documentación especializada para asistentes de IA y continuidad de desarrollo.

Ubicación:
```text
/docs/ai/
```

Archivos recomendados:
- continue.md
- skills.md
- architecture.md
- deployment.md
- ai_context.md
- roadmap.md

---

# Recomendaciones para Nuevos Desarrolladores

Antes de modificar el sistema:
1. Revisar `/docs/ai/`
2. Verificar qué backend está siendo utilizado
3. No asumir que Node.js es producción
4. Revisar compatibilidad con Hostinger
5. Mantener compatibilidad con estructura actual

---

# Estado General

SciDifusión actualmente representa una plataforma académica funcional y en crecimiento con:
- frontend moderno,
- backend híbrido,
- autenticación,
- RBAC,
- multimedia,
- integración BBB,
- y despliegue institucional real.

El enfoque actual del proyecto está orientado a:
- consolidación,
- estabilidad,
- documentación,
- y escalabilidad futura.

---

# Autor

Proyecto desarrollado por:

**Emmanuel Rojas**
- ESISCOM
- Facultad de Ciencias de la Cultura Física
- Universidad Autónoma de Chihuahua

---
