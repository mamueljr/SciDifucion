CREATE TABLE IF NOT EXISTS `categorias` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `descripcion` TEXT,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contenido_categorias` (
    `contenido_id` BIGINT UNSIGNED NOT NULL,
    `categoria_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`contenido_id`, `categoria_id`),
    FOREIGN KEY (`contenido_id`) REFERENCES `contenido`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `categorias` (nombre, slug, descripcion) VALUES
('Educación', 'educacion', 'Investigación y práctica educativa'),
('Tecnología', 'tecnologia', 'Herramientas, plataformas e innovación tecnológica'),
('Ciencias Sociales', 'ciencias-sociales', 'Estudios sociales, comunidad y cultura'),
('Salud', 'salud', 'Investigación relacionada con bienestar y ciencias de la salud'),
('Inteligencia Artificial', 'inteligencia-artificial', 'Aplicaciones, modelos y análisis con IA'),
('Investigación Educativa', 'investigacion-educativa', 'Líneas, métodos y resultados de investigación educativa');
