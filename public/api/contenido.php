<?php
require_once 'config.php';

$uploadsDir = dirname(__DIR__) . '/uploads';
$maxUploadSize = 20 * 1024 * 1024;
$allowedMimeTypes = [
    'application/pdf' => 'documento',
    'image/jpeg' => 'imagen',
    'image/png' => 'imagen',
    'image/webp' => 'imagen',
    'audio/mpeg' => 'audio',
    'audio/wav' => 'audio',
    'video/mp4' => 'video',
];

function normalizePublicPath(string $generatedName): string
{
    $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    return str_replace('/api/../', '/', $basePath . '/../uploads/' . $generatedName);
}

function deletePhysicalFile(string $uploadsDir, ?string $publicPath): void
{
    if (!$publicPath) {
        return;
    }

    $filePath = $uploadsDir . '/' . basename($publicPath);
    if (is_file($filePath)) {
        unlink($filePath);
    }
}

function handleIncomingFile(?array $archivo, string $uploadsDir, int $maxUploadSize, array $allowedMimeTypes): ?array
{
    if (!$archivo || ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($archivo['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Error al subir el archivo', 400);
    }

    if (($archivo['size'] ?? 0) > $maxUploadSize) {
        throw new RuntimeException('El archivo supera el límite de 20 MB', 400);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $archivo['tmp_name']);
    finfo_close($finfo);

    if (!isset($allowedMimeTypes[$mimeType])) {
        throw new RuntimeException('Formato no permitido. Usa PDF, JPG, PNG, WebP, MP3, WAV o MP4', 400);
    }

    if (!is_dir($uploadsDir) && !mkdir($uploadsDir, 0775, true) && !is_dir($uploadsDir)) {
        throw new RuntimeException('No se pudo preparar la carpeta de uploads', 500);
    }

    $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
    $baseName = strtolower(pathinfo($archivo['name'], PATHINFO_FILENAME));
    $safeBaseName = preg_replace('/[^a-z0-9-_]+/', '-', $baseName);
    $safeBaseName = trim((string) $safeBaseName, '-');
    $safeBaseName = substr($safeBaseName ?: 'archivo', 0, 80);
    $generatedName = time() . '-' . $safeBaseName . ($extension ? '.' . $extension : '');

    $savedFilePath = $uploadsDir . '/' . $generatedName;
    $publicFilePath = normalizePublicPath($generatedName);

    if (!move_uploaded_file($archivo['tmp_name'], $savedFilePath)) {
        throw new RuntimeException('No se pudo guardar el archivo', 500);
    }

    return [
        'saved_path' => $savedFilePath,
        'public_path' => $publicFilePath,
        'original_name' => $archivo['name'],
        'mime_type' => $mimeType,
        'size' => $archivo['size'],
    ];
}

function getOwnedContent(PDO $pdo, int $contentId, int $userId): array
{
    $stmt = $pdo->prepare(
        "SELECT c.id, c.autor_id, c.titulo, c.cuerpo, c.tipo_id, c.estado,
                a.id AS archivo_id, a.nombre_original AS archivo_nombre, a.ruta AS archivo_url
         FROM contenido c
         LEFT JOIN archivos a ON a.entidad_tipo = 'contenido' AND a.entidad_id = c.id
         WHERE c.id = ? AND c.autor_id = ?
         LIMIT 1"
    );
    $stmt->execute([$contentId, $userId]);
    $contenido = $stmt->fetch();

    if (!$contenido) {
        http_response_code(403);
        echo json_encode(['error' => 'Solo puedes modificar o eliminar tus propias publicaciones']);
        exit;
    }

    return $contenido;
}

$requestMethod = $_SERVER['REQUEST_METHOD'];
$action = $_POST['accion'] ?? '';
$sessionUser = $_SESSION['user'] ?? null;

if ($requestMethod === 'GET') {
    try {
        ensureContentCommentsTable($pdo);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo preparar la tabla de comentarios']);
        exit;
    }

    $userId = $sessionUser ? $sessionUser['id'] : 0;
    
    $whereClause = "WHERE c.estado = 'publicado'";
    $params = [$userId]; 
    if ($sessionUser) {
        $whereClause .= " OR c.autor_id = ?";
        $params[] = $sessionUser['id'];
    }

    $sql = "SELECT c.id, c.titulo, c.cuerpo, c.estado, c.created_at, c.autor_id, c.tipo_id,
                   u.nombre AS autor, t.nombre AS tipo, r.nombre AS autor_rol,
                   a.nombre_original AS archivo_nombre, a.ruta AS archivo_url, a.mime_type AS archivo_mime_type,
                   COALESCE(l.likes_count, 0) AS likes_count,
                   COALESCE(cm.comments_count, 0) AS comments_count,
                   IF(cl_user.id IS NOT NULL, 1, 0) AS user_liked
            FROM contenido c
            JOIN usuarios u ON c.autor_id = u.id
            JOIN tipos_contenido t ON c.tipo_id = t.id
            LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id
            LEFT JOIN roles r ON ur.rol_id = r.id
            LEFT JOIN archivos a ON a.entidad_tipo = 'contenido' AND a.entidad_id = c.id
            LEFT JOIN (
                SELECT contenido_id, COUNT(*) as likes_count 
                FROM contenido_likes 
                GROUP BY contenido_id
            ) l ON c.id = l.contenido_id
            LEFT JOIN (
                SELECT contenido_id, COUNT(*) as comments_count
                FROM contenido_comentarios
                GROUP BY contenido_id
            ) cm ON c.id = cm.contenido_id
            LEFT JOIN contenido_likes cl_user ON c.id = cl_user.contenido_id AND cl_user.usuario_id = ?
            $whereClause
            ORDER BY likes_count DESC, 
                     CASE r.nombre 
                        WHEN 'admin' THEN 3 
                        WHEN 'investigador' THEN 2 
                        ELSE 1 
                     END DESC, 
                     c.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    // Convert boolean user_liked to actual boolean and likes_count to int
    foreach($results as &$row) {
        $row['user_liked'] = (bool) $row['user_liked'];
        $row['likes_count'] = (int) $row['likes_count'];
        $row['comments_count'] = (int) $row['comments_count'];
    }
    
    echo json_encode($results);
    exit;
}

if ($requestMethod === 'POST' && $action === 'eliminar') {
    $user = requireAuth();
    $contentId = isset($_POST['id']) ? (int) $_POST['id'] : 0;

    if ($contentId < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de publicación inválido']);
        exit;
    }

    $contenido = getOwnedContent($pdo, $contentId, (int) $user['id']);

    try {
        $pdo->beginTransaction();

        if (!empty($contenido['archivo_id'])) {
            $stmt = $pdo->prepare("DELETE FROM archivos WHERE id = ?");
            $stmt->execute([$contenido['archivo_id']]);
        }

        $stmt = $pdo->prepare("DELETE FROM contenido WHERE id = ? AND autor_id = ?");
        $stmt->execute([$contentId, $user['id']]);

        $pdo->commit();
        deletePhysicalFile($uploadsDir, $contenido['archivo_url'] ?? null);

        echo json_encode(['message' => 'Publicación eliminada']);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(400);
        echo json_encode(['error' => 'No se pudo eliminar la publicación']);
    }
    exit;
}

if ($requestMethod !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$user = requireAuth();

$titulo = trim($_POST['titulo'] ?? '');
$cuerpo = trim($_POST['cuerpo'] ?? '');
$tipo_id = isset($_POST['tipo_id']) ? (int) $_POST['tipo_id'] : 1;
$estado = $_POST['estado'] ?? 'publicado';
$archivo = $_FILES['archivo'] ?? null;
$estado = in_array($estado, ['publicado', 'borrador', 'archivado'], true) ? $estado : 'publicado';

if (!$titulo || !$cuerpo || !$tipo_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos obligatorios']);
    exit;
}

$uploadedFile = null;

try {
    $uploadedFile = handleIncomingFile($archivo, $uploadsDir, $maxUploadSize, $allowedMimeTypes);
} catch (RuntimeException $e) {
    http_response_code($e->getCode() >= 400 ? $e->getCode() : 500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

if ($action === 'actualizar') {
    $contentId = isset($_POST['id']) ? (int) $_POST['id'] : 0;
    $removeAttachment = ($_POST['remove_attachment'] ?? '0') === '1';

    if ($contentId < 1) {
        if ($uploadedFile) {
            deletePhysicalFile($uploadsDir, $uploadedFile['public_path']);
        }
        http_response_code(400);
        echo json_encode(['error' => 'ID de publicación inválido']);
        exit;
    }

    $contenido = getOwnedContent($pdo, $contentId, (int) $user['id']);
    $slug = preg_replace('/[^\w-]+/', '', str_replace(' ', '-', strtolower($titulo)));
    $oldAttachmentPath = $contenido['archivo_url'] ?? null;

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare(
            "UPDATE contenido
             SET titulo = ?, slug = ?, cuerpo = ?, tipo_id = ?, estado = ?
             WHERE id = ? AND autor_id = ?"
        );
        $stmt->execute([$titulo, $slug, $cuerpo, $tipo_id, $estado, $contentId, $user['id']]);

        if (!empty($contenido['archivo_id']) && ($removeAttachment || $uploadedFile)) {
            $stmt = $pdo->prepare("DELETE FROM archivos WHERE id = ?");
            $stmt->execute([$contenido['archivo_id']]);
        }

        if ($uploadedFile) {
            $stmt = $pdo->prepare(
                "INSERT INTO archivos
                 (nombre_original, ruta, mime_type, size, entidad_tipo, entidad_id)
                 VALUES (?, ?, ?, ?, 'contenido', ?)"
            );
            $stmt->execute([
                $uploadedFile['original_name'],
                $uploadedFile['public_path'],
                $uploadedFile['mime_type'],
                $uploadedFile['size'],
                $contentId,
            ]);
        }

        $pdo->commit();

        if (($removeAttachment || $uploadedFile) && $oldAttachmentPath) {
            deletePhysicalFile($uploadsDir, $oldAttachmentPath);
        }

        echo json_encode([
            'message' => 'Publicación actualizada',
            'archivo' => $uploadedFile ? [
                'nombre' => $uploadedFile['original_name'],
                'url' => $uploadedFile['public_path'],
                'mimeType' => $uploadedFile['mime_type'],
                'size' => $uploadedFile['size'],
            ] : null,
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($uploadedFile) {
            deletePhysicalFile($uploadsDir, $uploadedFile['public_path']);
        }
        http_response_code(400);
        echo json_encode(['error' => 'No se pudo actualizar la publicación']);
    }
    exit;
}

authorize($pdo, $user['id'], 'contenido.crear');

$slug = preg_replace('/[^\w-]+/', '', str_replace(' ', '-', strtolower($titulo)));

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        "INSERT INTO contenido (titulo, slug, cuerpo, autor_id, tipo_id, estado)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$titulo, $slug, $cuerpo, $user['id'], $tipo_id, $estado]);
    $contenidoId = $pdo->lastInsertId();

    if ($uploadedFile) {
        $stmt = $pdo->prepare(
            "INSERT INTO archivos
             (nombre_original, ruta, mime_type, size, entidad_tipo, entidad_id)
             VALUES (?, ?, ?, ?, 'contenido', ?)"
        );
        $stmt->execute([
            $uploadedFile['original_name'],
            $uploadedFile['public_path'],
            $uploadedFile['mime_type'],
            $uploadedFile['size'],
            $contenidoId,
        ]);
    }

    $pdo->commit();
    http_response_code(201);
    echo json_encode([
        'message' => 'Contenido creado',
        'archivo' => $uploadedFile ? [
            'nombre' => $uploadedFile['original_name'],
            'url' => $uploadedFile['public_path'],
            'mimeType' => $uploadedFile['mime_type'],
            'size' => $uploadedFile['size'],
        ] : null,
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($uploadedFile) {
        deletePhysicalFile($uploadsDir, $uploadedFile['public_path']);
    }
    http_response_code(400);
    echo json_encode(['error' => 'Error al crear contenido (posible slug duplicado)']);
}
exit;
