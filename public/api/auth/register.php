<?php
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$nombre = $data['nombre'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'publico';

if (!$nombre || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan datos']);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$nombre, $email, $hashedPassword]);
    $userId = $pdo->lastInsertId();

    $stmt = $pdo->prepare("SELECT id FROM roles WHERE nombre = ?");
    $stmt->execute([$role]);
    $rol = $stmt->fetch();

    if ($rol) {
        $stmt = $pdo->prepare("INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)");
        $stmt->execute([$userId, $rol['id']]);
    }

    http_response_code(201);
    echo json_encode(['message' => 'Usuario registrado con éxito']);
} catch (PDOException $e) {
    http_response_code(400);
    echo json_encode(['error' => 'El email ya existe o datos inválidos']);
}
