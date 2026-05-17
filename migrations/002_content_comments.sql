CREATE TABLE IF NOT EXISTS `contenido_comentarios` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `contenido_id` BIGINT UNSIGNED NOT NULL,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `comentario` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_contenido_comentarios_contenido_id` (`contenido_id`),
    INDEX `idx_contenido_comentarios_usuario_id` (`usuario_id`),
    CONSTRAINT `fk_contenido_comentarios_contenido`
      FOREIGN KEY (`contenido_id`) REFERENCES `contenido`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_contenido_comentarios_usuario`
      FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
