<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$user = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$contenidoId = isset($data['contenido_id']) ? (int) $data['contenido_id'] : 0;

if ($contenidoId < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de contenido inválido']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Revisa si el like ya existe
    $stmt = $pdo->prepare("SELECT id FROM contenido_likes WHERE contenido_id = ? AND usuario_id = ?");
    $stmt->execute([$contenidoId, $user['id']]);
    $existingLike = $stmt->fetch();

    $liked = false;

    if ($existingLike) {
        // Si ya existe, lo borra (Unlike)
        $stmt = $pdo->prepare("DELETE FROM contenido_likes WHERE id = ?");
        $stmt->execute([$existingLike['id']]);
    } else {
        // Si no existe, lo inserta (Like)
        $stmt = $pdo->prepare("INSERT INTO contenido_likes (contenido_id, usuario_id) VALUES (?, ?)");
        $stmt->execute([$contenidoId, $user['id']]);
        $liked = true;
    }

    // Obtener el nuevo total de likes
    $stmt = $pdo->prepare("SELECT COUNT(*) AS total_likes FROM contenido_likes WHERE contenido_id = ?");
    $stmt->execute([$contenidoId]);
    $result = $stmt->fetch();
    $totalLikes = (int) $result['total_likes'];

    $pdo->commit();

    echo json_encode([
        'message' => $liked ? 'Like agregado' : 'Like removido',
        'liked' => $liked,
        'likes_count' => $totalLikes
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Error al procesar el me gusta']);
}
