<?php
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$token = $data['token'] ?? '';
$password = $data['password'] ?? '';

if (!$token || !preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400);
    echo json_encode(['error' => 'Token invalido']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'La contrasena debe tener al menos 8 caracteres']);
    exit;
}

$tokenHash = hash('sha256', $token);

$stmt = $pdo->prepare(
    "SELECT pr.id, pr.usuario_id
     FROM password_resets pr
     JOIN usuarios u ON u.id = pr.usuario_id
     WHERE pr.token_hash = ?
       AND pr.used_at IS NULL
       AND pr.expires_at > NOW()
       AND u.activo = 1
     LIMIT 1"
);
$stmt->execute([$tokenHash]);
$reset = $stmt->fetch();

if (!$reset) {
    http_response_code(400);
    echo json_encode(['error' => 'El enlace expiro o ya fue utilizado']);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
    $stmt->execute([$hashedPassword, $reset['usuario_id']]);

    $stmt = $pdo->prepare("UPDATE password_resets SET used_at = NOW() WHERE id = ?");
    $stmt->execute([$reset['id']]);

    $stmt = $pdo->prepare("UPDATE password_resets SET used_at = NOW() WHERE usuario_id = ? AND used_at IS NULL");
    $stmt->execute([$reset['usuario_id']]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo actualizar la contrasena']);
    exit;
}

echo json_encode(['message' => 'Contrasena actualizada correctamente']);
?>
