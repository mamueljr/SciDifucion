<?php
require_once 'config.php';

ensureCategoriesReady($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$stmt = $pdo->query("SELECT id, nombre, slug, descripcion FROM categorias ORDER BY nombre ASC");
echo json_encode($stmt->fetchAll());
