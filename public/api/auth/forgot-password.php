<?php
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$email = trim($data['email'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Correo invalido']);
    exit;
}

$genericMessage = 'Si el correo existe, enviaremos instrucciones para restablecer la contrasena.';

$stmt = $pdo->prepare("SELECT id, nombre, email FROM usuarios WHERE email = ? AND activo = 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['message' => $genericMessage]);
    exit;
}

$token = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("UPDATE password_resets SET used_at = NOW() WHERE usuario_id = ? AND used_at IS NULL");
    $stmt->execute([$user['id']]);

    $stmt = $pdo->prepare("INSERT INTO password_resets (usuario_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))");
    $stmt->execute([$user['id'], $tokenHash]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo crear la solicitud de recuperacion']);
    exit;
}

$resetUrl = appBaseUrl() . '/?reset_token=' . urlencode($token);
$emailSent = sendPasswordResetEmail($user['email'], $user['nombre'], $resetUrl);

if (!$emailSent) {
    $stmt = $pdo->prepare("UPDATE password_resets SET used_at = NOW() WHERE token_hash = ?");
    $stmt->execute([$tokenHash]);

    http_response_code(500);
    echo json_encode(['error' => 'No se pudo enviar el correo de recuperacion']);
    exit;
}

echo json_encode(['message' => $genericMessage]);
?>
