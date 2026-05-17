<?php
require_once 'config.php';

function canViewContent(PDO $pdo, int $contenidoId, ?array $sessionUser): bool {
    $stmt = $pdo->prepare("SELECT estado, autor_id FROM contenido WHERE id = ? LIMIT 1");
    $stmt->execute([$contenidoId]);
    $content = $stmt->fetch();

    if (!$content) {
        return false;
    }

    return $content['estado'] === 'publicado'
        || ($sessionUser && (int) $content['autor_id'] === (int) $sessionUser['id']);
}

function commentLength(string $comment): int {
    return function_exists('mb_strlen')
        ? mb_strlen($comment, 'UTF-8')
        : strlen($comment);
}

try {
    ensureContentCommentsTable($pdo);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo preparar la tabla de comentarios']);
    exit;
}

$requestMethod = $_SERVER['REQUEST_METHOD'];
$sessionUser = $_SESSION['user'] ?? null;

if ($requestMethod === 'GET') {
    $contenidoId = isset($_GET['contenido_id']) ? (int) $_GET['contenido_id'] : 0;

    if ($contenidoId < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de contenido inválido']);
        exit;
    }

    if (!canViewContent($pdo, $contenidoId, $sessionUser)) {
        http_response_code(404);
        echo json_encode(['error' => 'Publicación no encontrada']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT cc.id, cc.contenido_id, cc.usuario_id, cc.comentario, cc.created_at,
                                  u.nombre AS autor
                           FROM contenido_comentarios cc
                           JOIN usuarios u ON cc.usuario_id = u.id
                           WHERE cc.contenido_id = ?
                           ORDER BY cc.created_at ASC, cc.id ASC");
    $stmt->execute([$contenidoId]);
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($requestMethod === 'POST') {
    $user = requireAuth();
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $contenidoId = isset($data['contenido_id']) ? (int) $data['contenido_id'] : 0;
    $comentario = trim((string) ($data['comentario'] ?? ''));

    if ($contenidoId < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de contenido inválido']);
        exit;
    }

    if ($comentario === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Escribe un comentario antes de publicarlo']);
        exit;
    }

    if (commentLength($comentario) > 1000) {
        http_response_code(400);
        echo json_encode(['error' => 'El comentario no puede superar 1000 caracteres']);
        exit;
    }

    if (!canViewContent($pdo, $contenidoId, $user)) {
        http_response_code(404);
        echo json_encode(['error' => 'Publicación no encontrada']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO contenido_comentarios (contenido_id, usuario_id, comentario) VALUES (?, ?, ?)");
        $stmt->execute([$contenidoId, $user['id'], $comentario]);
        $commentId = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT cc.id, cc.contenido_id, cc.usuario_id, cc.comentario, cc.created_at,
                                      u.nombre AS autor
                               FROM contenido_comentarios cc
                               JOIN usuarios u ON cc.usuario_id = u.id
                               WHERE cc.id = ?");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch();

        $stmt = $pdo->prepare("SELECT COUNT(*) AS comments_count FROM contenido_comentarios WHERE contenido_id = ?");
        $stmt->execute([$contenidoId]);
        $count = $stmt->fetch();

        echo json_encode([
            'message' => 'Comentario agregado',
            'comment' => $comment,
            'comments_count' => (int) $count['comments_count']
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al publicar el comentario']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
