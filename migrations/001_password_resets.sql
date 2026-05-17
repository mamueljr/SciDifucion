-- Agrega soporte para recuperación de contraseña por correo.
-- Ejecutar una sola vez en bases existentes de SciDifusión.

CREATE TABLE IF NOT EXISTS `password_resets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_password_resets_token_hash` (`token_hash`),
    INDEX `idx_password_resets_usuario_id` (`usuario_id`),
    INDEX `idx_password_resets_expires_at` (`expires_at`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
