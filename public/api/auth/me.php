<?php
require_once '../config.php';
$user = requireAuth();

ensureUserProfilesTable($pdo);

$stmt = $pdo->prepare("SELECT u.id, u.nombre, u.email,
    up.biografia, up.institucion, up.telefono, up.ubicacion, up.sitio_web,
    up.orcid, up.lineas_investigacion,
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
