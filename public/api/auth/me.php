<?php
require_once '../config.php';
$user = requireAuth();

$stmt = $pdo->prepare("SELECT id, nombre, email FROM usuarios WHERE id = ?");
$stmt->execute([$user['id']]);
$dbUser = $stmt->fetch();

if (!$dbUser) {
    http_response_code(404);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

echo json_encode(array_merge($user, ['nombre' => $dbUser['nombre']]));
