<?php
require_once 'config.php';

ensureUserProfilesTable($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$authorId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($authorId < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de autor inválido']);
    exit;
}

$stmt = $pdo->prepare("SELECT u.id, u.nombre, u.email,
                              up.biografia, up.institucion, up.ubicacion, up.sitio_web,
                              up.orcid, up.lineas_investigacion,
                              a.nombre_original AS foto_nombre, a.ruta AS foto_url, a.mime_type AS foto_mime_type
                       FROM usuarios u
                       LEFT JOIN usuarios_perfiles up ON up.usuario_id = u.id
                       LEFT JOIN archivos a ON a.entidad_tipo = 'usuario' AND a.entidad_id = u.id
                       WHERE u.id = ?
                       LIMIT 1");
$stmt->execute([$authorId]);
$profile = $stmt->fetch();

if (!$profile) {
    http_response_code(404);
    echo json_encode(['error' => 'Autor no encontrado']);
    exit;
}

$stmt = $pdo->prepare("SELECT c.id, c.titulo, c.created_at, t.nombre AS tipo
                       FROM contenido c
                       JOIN tipos_contenido t ON c.tipo_id = t.id
                       WHERE c.autor_id = ? AND c.estado = 'publicado'
                       ORDER BY c.created_at DESC
                       LIMIT 6");
$stmt->execute([$authorId]);
$publications = $stmt->fetchAll();

foreach ($publications as &$publication) {
    $publication['id'] = (int) $publication['id'];
}

echo json_encode([
    'profile' => $profile,
    'publications' => $publications,
]);
