# Presentación: SciDifusión v1.0

Esta primera versión de **SciDifusión** representa un paso fundamental hacia la modernización de la divulgación académica. A continuación, se detalla la propuesta de valor y las capacidades del sistema actual.

## 1. ¿Qué es SciDifusión? (El "Elevator Pitch")

**SciDifusión** es una plataforma digital segura y un repositorio centralizado diseñado específicamente para la comunidad académica. Su objetivo principal es facilitar la publicación, organización y acceso a hallazgos de investigación, artículos y contenido multimedia de nuestra institución, todo operando bajo una interfaz moderna y un estricto control de acceso.

## 2. ¿Para qué sirve? (Funcionalidades Principales)

*   **Repositorio Centralizado:** Funciona como una biblioteca digital viva. Cualquier persona que acceda a la plataforma puede leer las investigaciones, identificar al autor y revisar la fecha exacta de publicación.
*   **Publicación Ágil:** Permite que los investigadores creen y suban contenido rápidamente (en formatos como Artículos, Videos o Podcasts) a través de una interfaz amigable, sin necesidad de conocimientos de programación.
*   **Control de Seguridad y Roles (RBAC):** El sistema garantiza la integridad de la información mediante 3 niveles de permisos:
    1.  **Público General:** Usuarios con acceso de solo lectura para consumir el conocimiento.
    2.  **Investigadores:** Autores verificados con el privilegio de acceder al "Módulo de Publicación" para aportar nuevo contenido al repositorio.
    3.  **Administradores:** Nivel de control total (Root) sobre la plataforma y la base de usuarios.

## 3. ¿Qué destaca a nivel técnico?

*   **Diseño de Vanguardia:** Rompiendo con el esquema de las plataformas académicas tradicionales, SciDifusión emplea una estética *Dark Mode* de corte tecnológico (inspirada en interfaces de ciberseguridad), lo cual la hace visualmente atractiva y moderna para las nuevas generaciones.
*   **Arquitectura Híbrida (React + PHP):** 
    *   **Frontend (Visual):** Desarrollado en **React**, ofreciendo la velocidad, reactividad y dinamismo visual que utilizan líderes tecnológicos como Facebook o Netflix.
    *   **Backend (Servidor):** Respaldado por la solidez y amplia compatibilidad de **PHP y MySQL**, garantizando que los datos se almacenen de forma estructurada y segura en el servidor de Hostinger.
*   **Autenticación Nativa Segura:** Implementa un sistema de encriptación de contraseñas de un solo sentido (`password_hash`). Además, el inicio de sesión está protegido a nivel servidor contra intentos de elevación de privilegios (nadie puede auto-registrarse como administrador).

## Resumen Ejecutivo

> *"Tenemos la base de una red académica propia. En esta primera fase, la plataforma ya es capaz de registrar usuarios de forma segura, distinguir quién es un lector y quién es un investigador, y permitir a los autores verificados publicar contenido que queda inmediatamente disponible para todo el mundo en nuestro repositorio web."*

---
*Documento generado para apoyo en presentaciones y documentación del proyecto.*
