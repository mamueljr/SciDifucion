-- Database Schema for SciDifusión (MySQL)
-- Designed by Senior Software Architect

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `email_verificado_at` TIMESTAMP NULL,
    `ultimo_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `activo` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Roles
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL UNIQUE, -- 'admin', 'investigador', 'publico'
    `descripcion` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Permisos
CREATE TABLE IF NOT EXISTS `permisos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL UNIQUE, -- 'contenido.crear', 'contenido.eliminar', 'sala_virtual.acceso'
    `descripcion` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Asociación Roles y Permisos (Pivote)
CREATE TABLE IF NOT EXISTS `roles_permisos` (
    `rol_id` BIGINT UNSIGNED NOT NULL,
    `permiso_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`rol_id`, `permiso_id`),
    FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permiso_id`) REFERENCES `permisos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Asociación Usuarios y Roles (Pivote)
CREATE TABLE IF NOT EXISTS `usuarios_roles` (
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `rol_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`usuario_id`, `rol_id`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Tipos de Contenido
CREATE TABLE IF NOT EXISTS `tipos_contenido` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL UNIQUE, -- 'articulo', 'video', 'podcast', 'infografia'
    `slug` VARCHAR(50) NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 7. Categorías
CREATE TABLE IF NOT EXISTS `categorias` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `descripcion` TEXT,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 8. Contenido
CREATE TABLE IF NOT EXISTS `contenido` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `resumen` TEXT,
    `cuerpo` LONGTEXT,
    `autor_id` BIGINT UNSIGNED NOT NULL,
    `tipo_id` BIGINT UNSIGNED NOT NULL,
    `estado` ENUM('borrador', 'publicado', 'archivado') DEFAULT 'borrador',
    `visualizaciones` BIGINT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `published_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`),
    FOREIGN KEY (`tipo_id`) REFERENCES `tipos_contenido`(`id`),
    INDEX `idx_slug` (`slug`),
    INDEX `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Asociación Contenido y Categorías
CREATE TABLE IF NOT EXISTS `contenido_categorias` (
    `contenido_id` BIGINT UNSIGNED NOT NULL,
    `categoria_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`contenido_id`, `categoria_id`),
    FOREIGN KEY (`contenido_id`) REFERENCES `contenido`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Archivos Multimedia
CREATE TABLE IF NOT EXISTS `archivos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre_original` VARCHAR(255) NOT NULL,
    `ruta` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100),
    `size` BIGINT,
    `entidad_tipo` VARCHAR(50), -- 'contenido', 'usuario'
    `entidad_id` BIGINT UNSIGNED,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 11. Auditoría (Logs de Acciones)
CREATE TABLE IF NOT EXISTS `auditoria` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT UNSIGNED NULL,
    `accion` VARCHAR(100) NOT NULL, -- 'crear_contenido', 'eliminar_usuario', 'login'
    `tabla` VARCHAR(50),
    `registro_id` BIGINT UNSIGNED,
    `payload_antes` JSON,
    `payload_despues` JSON,
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Insertar Datos Iniciales Bésicos
INSERT INTO `roles` (nombre, descripcion) VALUES 
('admin', 'Administrador total del sistema'),
('investigador', 'Miembro académico que puede crear contenido'),
('publico', 'Usuario general que consume contenido');

INSERT INTO `permisos` (nombre, descripcion) VALUES 
('contenido.crear', 'Permite subir nuevos artículos y recursos'),
('contenido.editar_propio', 'Permite editar lo propio'),
('contenido.editar_todo', 'Permite editar contenido de otros'),
('contenido.eliminar', 'Permite borrar contenido'),
('sala_virtual.acceso', 'Permite entrar a la sala de investigadores'),
('usuarios.gestionar', 'Control de cuentas de usuario');

-- Asignar todos los permisos al admin (ejemplo simplificado id=1)
-- Asignar permisos bésicos al investigador
INSERT INTO `tipos_contenido` (nombre, slug) VALUES 
('Artículo', 'articulo'), 
('Video', 'video'), 
('Podcast', 'podcast'), 
('Infografía', 'infografia');
