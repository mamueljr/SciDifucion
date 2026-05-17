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

function ensureContentCommentsTable(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS contenido_comentarios (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        contenido_id BIGINT UNSIGNED NOT NULL,
        usuario_id BIGINT UNSIGNED NOT NULL,
        comentario TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_contenido_comentarios_contenido_id (contenido_id),
        INDEX idx_contenido_comentarios_usuario_id (usuario_id),
        CONSTRAINT fk_contenido_comentarios_contenido
          FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
        CONSTRAINT fk_contenido_comentarios_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function ensureCategoriesReady(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS categorias (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS contenido_categorias (
        contenido_id BIGINT UNSIGNED NOT NULL,
        categoria_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (contenido_id, categoria_id),
        FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $defaultCategories = [
        ['Educación', 'educacion', 'Investigación y práctica educativa'],
        ['Tecnología', 'tecnologia', 'Herramientas, plataformas e innovación tecnológica'],
        ['Ciencias Sociales', 'ciencias-sociales', 'Estudios sociales, comunidad y cultura'],
        ['Salud', 'salud', 'Investigación relacionada con bienestar y ciencias de la salud'],
        ['Inteligencia Artificial', 'inteligencia-artificial', 'Aplicaciones, modelos y análisis con IA'],
        ['Investigación Educativa', 'investigacion-educativa', 'Líneas, métodos y resultados de investigación educativa'],
    ];

    $stmt = $pdo->prepare("INSERT IGNORE INTO categorias (nombre, slug, descripcion) VALUES (?, ?, ?)");
    foreach ($defaultCategories as $category) {
        $stmt->execute($category);
    }
}

function ensureUserProfilesTable(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios_perfiles (
        usuario_id BIGINT UNSIGNED NOT NULL,
        biografia TEXT NULL,
        institucion VARCHAR(255) NULL,
        telefono VARCHAR(50) NULL,
        ubicacion VARCHAR(255) NULL,
        sitio_web VARCHAR(255) NULL,
        orcid VARCHAR(32) NULL,
        lineas_investigacion TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (usuario_id),
        CONSTRAINT fk_usuarios_perfiles_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $stmt = $pdo->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios_perfiles'");
    $stmt->execute();
    $columns = array_column($stmt->fetchAll(), 'COLUMN_NAME');

    if (!in_array('orcid', $columns, true)) {
        $pdo->exec("ALTER TABLE usuarios_perfiles ADD COLUMN orcid VARCHAR(32) NULL AFTER sitio_web");
    }

    if (!in_array('lineas_investigacion', $columns, true)) {
        $pdo->exec("ALTER TABLE usuarios_perfiles ADD COLUMN lineas_investigacion TEXT NULL AFTER orcid");
    }
}

function appBaseUrl() {
    $configuredUrl = getenv('APP_URL');
    if ($configuredUrl) {
        return rtrim($configuredUrl, '/');
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $apiPosition = strpos($scriptDir, '/api');
    $basePath = $apiPosition !== false ? substr($scriptDir, 0, $apiPosition) : '';

    return rtrim($scheme . '://' . $host . $basePath, '/');
}

function sendPasswordResetEmail($to, $name, $resetUrl) {
    $from = getenv('MAIL_FROM') ?: 'no-reply@scidifusion.local';
    $fromName = getenv('MAIL_FROM_NAME') ?: 'SciDifusion';
    $subject = 'Recupera tu contrasena de SciDifusion';
    $safeName = trim($name) ?: 'usuario';
    $message = "Hola {$safeName},\n\n";
    $message .= "Recibimos una solicitud para restablecer tu contrasena.\n\n";
    $message .= "Abre este enlace para crear una nueva contrasena:\n{$resetUrl}\n\n";
    $message .= "El enlace vence en 1 hora. Si no solicitaste este cambio, ignora este correo.\n\n";
    $message .= "SciDifusion";

    $headers = [
        'From: ' . $fromName . ' <' . $from . '>',
        'Reply-To: ' . $from,
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];

    return mail($to, $subject, $message, implode("\r\n", $headers));
}
?>
