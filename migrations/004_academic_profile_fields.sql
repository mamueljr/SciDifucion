CREATE TABLE IF NOT EXISTS `usuarios_perfiles` (
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `biografia` TEXT NULL,
    `institucion` VARCHAR(255) NULL,
    `telefono` VARCHAR(50) NULL,
    `ubicacion` VARCHAR(255) NULL,
    `sitio_web` VARCHAR(255) NULL,
    `orcid` VARCHAR(32) NULL,
    `lineas_investigacion` TEXT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`usuario_id`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @has_orcid = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios_perfiles'
      AND COLUMN_NAME = 'orcid'
);
SET @sql_orcid = IF(@has_orcid = 0,
    'ALTER TABLE `usuarios_perfiles` ADD COLUMN `orcid` VARCHAR(32) NULL AFTER `sitio_web`',
    'SELECT 1'
);
PREPARE stmt_orcid FROM @sql_orcid;
EXECUTE stmt_orcid;
DEALLOCATE PREPARE stmt_orcid;

SET @has_lineas = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios_perfiles'
      AND COLUMN_NAME = 'lineas_investigacion'
);
SET @sql_lineas = IF(@has_lineas = 0,
    'ALTER TABLE `usuarios_perfiles` ADD COLUMN `lineas_investigacion` TEXT NULL AFTER `orcid`',
    'SELECT 1'
);
PREPARE stmt_lineas FROM @sql_lineas;
EXECUTE stmt_lineas;
DEALLOCATE PREPARE stmt_lineas;
