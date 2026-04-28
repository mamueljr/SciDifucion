<?php
require_once '../config.php';

$profileTableSql = "CREATE TABLE IF NOT EXISTS usuarios_perfiles (
    usuario_id BIGINT UNSIGNED NOT NULL,
    biografia TEXT NULL,
    institucion VARCHAR(255) NULL,
    telefono VARCHAR(50) NULL,
    ubicacion VARCHAR(255) NULL,
    sitio_web VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    CONSTRAINT fk_usuarios_perfiles_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

$pdo->exec($profileTableSql);

$uploadsDir = dirname(__DIR__) . '/uploads';
$maxImageSize = 5 * 1024 * 1024;
$allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
];

function profileUploadPath(string $generatedName): string
{
    $basePath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/');
    return $basePath . '/uploads/' . $generatedName;
}

function profileDeletePhoto(string $uploadsDir, ?string $publicPath): void
{
    if (!$publicPath) {
        return;
    }

    $filePath = $uploadsDir . '/' . basename($publicPath);
    if (is_file($filePath)) {
        unlink($filePath);
    }
}

function fetchProfile(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare(
        "SELECT u.id, u.nombre, u.email,
                up.biografia, up.institucion, up.telefono, up.ubicacion, up.sitio_web,
                a.nombre_original AS foto_nombre, a.ruta AS foto_url, a.mime_type AS foto_mime_type
         FROM usuarios u
         LEFT JOIN usuarios_perfiles up ON up.usuario_id = u.id
         LEFT JOIN archivos a ON a.entidad_tipo = 'usuario' AND a.entidad_id = u.id
         WHERE u.id = ?
         LIMIT 1"
    );
    $stmt->execute([$userId]);
    $profile = $stmt->fetch();

    if (!$profile) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado']);
        exit;
    }

    return $profile;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = requireAuth();
    echo json_encode(fetchProfile($pdo, (int) $user['id']));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$user = requireAuth();
$nombre = trim($_POST['nombre'] ?? '');
$biografia = trim($_POST['biografia'] ?? '');
$institucion = trim($_POST['institucion'] ?? '');
$telefono = trim($_POST['telefono'] ?? '');
$ubicacion = trim($_POST['ubicacion'] ?? '');
$sitioWeb = trim($_POST['sitio_web'] ?? '');
$foto = $_FILES['foto'] ?? null;
$removePhoto = ($_POST['remove_photo'] ?? '0') === '1';

$savedFilePath = null;
$publicFilePath = null;
$mimeType = null;
$originalName = null;
$oldPhotoPath = null;

if ($foto && ($foto['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if ($foto['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Error al subir la foto']);
        exit;
    }

    if ($foto['size'] > $maxImageSize) {
        http_response_code(400);
        echo json_encode(['error' => 'La foto supera el límite de 5 MB']);
        exit;
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $foto['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedImageTypes, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'La foto debe ser JPG, PNG o WebP']);
        exit;
    }

    if (!is_dir($uploadsDir) && !mkdir($uploadsDir, 0775, true) && !is_dir($uploadsDir)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo preparar la carpeta de uploads']);
        exit;
    }

    $extension = strtolower(pathinfo($foto['name'], PATHINFO_EXTENSION));
    $baseName = strtolower(pathinfo($foto['name'], PATHINFO_FILENAME));
    $safeBaseName = preg_replace('/[^a-z0-9-_]+/', '-', $baseName);
    $safeBaseName = trim((string) $safeBaseName, '-');
    $safeBaseName = substr($safeBaseName ?: 'perfil', 0, 80);
    $generatedName = time() . '-perfil-' . $safeBaseName . ($extension ? '.' . $extension : '');

    $savedFilePath = $uploadsDir . '/' . $generatedName;
    $publicFilePath = profileUploadPath($generatedName);
    $originalName = $foto['name'];

    if (!move_uploaded_file($foto['tmp_name'], $savedFilePath)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo guardar la foto']);
        exit;
    }
}

try {
    $currentProfile = fetchProfile($pdo, (int) $user['id']);
    $oldPhotoPath = $currentProfile['foto_url'] ?? null;

    $pdo->beginTransaction();

    if ($nombre !== '') {
        $stmt = $pdo->prepare("UPDATE usuarios SET nombre = ? WHERE id = ?");
        $stmt->execute([$nombre, $user['id']]);
        $_SESSION['user']['nombre'] = $nombre;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO usuarios_perfiles (usuario_id, biografia, institucion, telefono, ubicacion, sitio_web)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         biografia = VALUES(biografia),
         institucion = VALUES(institucion),
         telefono = VALUES(telefono),
         ubicacion = VALUES(ubicacion),
         sitio_web = VALUES(sitio_web)"
    );
    $stmt->execute([$user['id'], $biografia ?: null, $institucion ?: null, $telefono ?: null, $ubicacion ?: null, $sitioWeb ?: null]);

    if (($removePhoto || $publicFilePath) && !empty($currentProfile['foto_url'])) {
        $stmt = $pdo->prepare("DELETE FROM archivos WHERE entidad_tipo = 'usuario' AND entidad_id = ?");
        $stmt->execute([$user['id']]);
    }

    if ($publicFilePath) {
        $stmt = $pdo->prepare(
            "INSERT INTO archivos (nombre_original, ruta, mime_type, size, entidad_tipo, entidad_id)
             VALUES (?, ?, ?, ?, 'usuario', ?)"
        );
        $stmt->execute([$originalName, $publicFilePath, $mimeType, $foto['size'], $user['id']]);
    }

    $pdo->commit();

    if (($removePhoto || $publicFilePath) && $oldPhotoPath) {
        profileDeletePhoto($uploadsDir, $oldPhotoPath);
    }

    echo json_encode([
        'message' => 'Perfil actualizado',
        'profile' => fetchProfile($pdo, (int) $user['id']),
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($savedFilePath && file_exists($savedFilePath)) {
        unlink($savedFilePath);
    }
    http_response_code(400);
    echo json_encode(['error' => 'No se pudo actualizar el perfil']);
}
