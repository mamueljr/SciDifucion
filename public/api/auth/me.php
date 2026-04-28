<?php
require_once '../config.php';
$user = requireAuth();

$pdo->exec("CREATE TABLE IF NOT EXISTS usuarios_perfiles (
    usuario_id BIGINT UNSIGNED NOT NULL,
    biografia TEXT NULL,
    institucion VARCHAR(255) NULL,
    telefono VARCHAR(50) NULL,
    ubicacion VARCHAR(255) NULL,
    sitio_web VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    CONSTRAINT fk_usuarios_perfiles_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$stmt = $pdo->prepare("SELECT u.id, u.nombre, u.email,
    up.biografia, up.institucion, up.telefono, up.ubicacion, up.sitio_web,
    a.nombre_original AS foto_nombre, a.ruta AS foto_url, a.mime_type AS foto_mime_type
    FROM usuarios u
    LEFT JOIN usuarios_perfiles up ON up.usuario_id = u.id
    LEFT JOIN archivos a ON a.entidad_tipo = 'usuario' AND a.entidad_id = u.id
    WHERE u.id = ?");
$stmt->execute([$user['id']]);
$dbUser = $stmt->fetch();

if (!$dbUser) {
    http_response_code(404);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

echo json_encode(array_merge($user, $dbUser, ['nombre' => $dbUser['nombre']]));
