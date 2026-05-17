<?php
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    if ((int) ($user['activo'] ?? 1) !== 1) {
        http_response_code(403);
        echo json_encode(['error' => 'Cuenta inactiva. Contacta al administrador.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT r.nombre FROM roles r
        JOIN usuarios_roles ur ON r.id = ur.rol_id
        WHERE ur.usuario_id = ?");
    $stmt->execute([$user['id']]);
    $rol = $stmt->fetch();
    $roleName = $rol ? $rol['nombre'] : 'publico';

    $_SESSION['user'] = [
        'id' => $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'role' => $roleName
    ];

    echo json_encode([
        'message' => 'Login exitoso',
        'user' => $_SESSION['user']
    ]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Credenciales inválidas']);
}
