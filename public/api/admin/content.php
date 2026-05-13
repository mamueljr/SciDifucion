<?php
require_once '../config.php';
$user = requireAuth();

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT c.id, c.titulo, c.created_at, c.estado, u.nombre as autor 
                         FROM contenido c 
                         JOIN usuarios u ON c.autor_id = u.id 
                         ORDER BY c.created_at DESC");
    $content = $stmt->fetchAll();
    echo json_encode($content);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'delete') {
        $id = $_POST['id'] ?? 0;
        
        // Also remove associated files if any
        $stmt = $pdo->prepare("SELECT id, ruta FROM archivos WHERE entidad_tipo = 'contenido' AND entidad_id = ?");
        $stmt->execute([$id]);
        $archivos = $stmt->fetchAll();
        foreach ($archivos as $archivo) {
            $fullPath = '../../' . $archivo['ruta'];
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
            $pdo->prepare("DELETE FROM archivos WHERE id = ?")->execute([$archivo['id']]);
        }

        $stmt = $pdo->prepare("DELETE FROM contenido WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }
}
