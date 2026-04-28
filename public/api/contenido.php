<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT c.id, c.titulo, c.cuerpo, c.estado, c.created_at,
                u.nombre AS autor, t.nombre AS tipo
         FROM contenido c
         JOIN usuarios u ON c.autor_id = u.id
         JOIN tipos_contenido t ON c.tipo_id = t.id
         WHERE c.estado = 'publicado'
         ORDER BY c.created_at DESC");
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = requireAuth();
    authorize($pdo, $user['id'], 'contenido.crear');

    $data = json_decode(file_get_contents('php://input'), true);
    $titulo = $data['titulo'] ?? '';
    $cuerpo = $data['cuerpo'] ?? '';
    $tipo_id = $data['tipo_id'] ?? 1;
    $estado = $data['estado'] ?? 'publicado';
    
    $slug = preg_replace('/[^\w-]+/', '', str_replace(' ', '-', strtolower($titulo)));

    try {
        $stmt = $pdo->prepare("INSERT INTO contenido (titulo, slug, cuerpo, autor_id, tipo_id, estado)
         VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$titulo, $slug, $cuerpo, $user['id'], $tipo_id, $estado]);
        http_response_code(201);
        echo json_encode(['message' => 'Contenido creado']);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Error al crear contenido (posible slug duplicado)']);
    }
    exit;
}
