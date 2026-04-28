<?php
// public/api/config.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = 'localhost';
$db   = 'u341911188_scidifusion';
$user = 'u341911188_erojasdifusion';
$pass = 'S6363kl234.';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Helper para validar si el usuario está logueado
function requireAuth() {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }
    return $_SESSION['user'];
}

function authorize($pdo, $userId, $permiso) {
    if ($_SESSION['user']['role'] === 'admin') return true;

    $stmt = $pdo->prepare("SELECT 1 FROM usuarios_roles ur
        JOIN roles_permisos rp ON ur.rol_id = rp.rol_id
        JOIN permisos p ON rp.permiso_id = p.id
        WHERE ur.usuario_id = ? AND p.nombre = ?");
    $stmt->execute([$userId, $permiso]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => "Permiso insuficiente: " . $permiso]);
        exit;
    }
    return true;
}
?>
