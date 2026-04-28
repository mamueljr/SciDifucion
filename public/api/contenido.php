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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT c.id, c.titulo, c.cuerpo, c.estado, c.created_at,
                u.nombre AS autor, t.nombre AS tipo,
                a.nombre_original AS archivo_nombre, a.ruta AS archivo_url, a.mime_type AS archivo_mime_type
         FROM contenido c
         JOIN usuarios u ON c.autor_id = u.id
         JOIN tipos_contenido t ON c.tipo_id = t.id
         LEFT JOIN archivos a ON a.entidad_tipo = 'contenido' AND a.entidad_id = c.id
         WHERE c.estado = 'publicado'
         ORDER BY c.created_at DESC");
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = requireAuth();
    authorize($pdo, $user['id'], 'contenido.crear');

    $titulo = $_POST['titulo'] ?? '';
    $cuerpo = $_POST['cuerpo'] ?? '';
    $tipo_id = isset($_POST['tipo_id']) ? (int)$_POST['tipo_id'] : 1;
    $estado = $_POST['estado'] ?? 'publicado';
    $archivo = $_FILES['archivo'] ?? null;
    
    $slug = preg_replace('/[^\w-]+/', '', str_replace(' ', '-', strtolower($titulo)));
    $estado = in_array($estado, ['publicado', 'borrador', 'archivado'], true) ? $estado : 'publicado';

    if (!$titulo || !$cuerpo || !$tipo_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos obligatorios']);
        exit;
    }

    $savedFilePath = null;
    $publicFilePath = null;
    $fileMimeType = null;
    $fileSize = null;
    $originalName = null;

    if ($archivo && ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Error al subir el archivo']);
            exit;
        }

        if ($archivo['size'] > $maxUploadSize) {
            http_response_code(400);
            echo json_encode(['error' => 'El archivo supera el límite de 20 MB']);
            exit;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $fileMimeType = finfo_file($finfo, $archivo['tmp_name']);
        finfo_close($finfo);

        if (!isset($allowedMimeTypes[$fileMimeType])) {
            http_response_code(400);
            echo json_encode(['error' => 'Formato no permitido. Usa PDF, JPG, PNG, WebP, MP3, WAV o MP4']);
            exit;
        }

        if (!is_dir($uploadsDir) && !mkdir($uploadsDir, 0775, true) && !is_dir($uploadsDir)) {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo preparar la carpeta de uploads']);
            exit;
        }

        $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        $baseName = strtolower(pathinfo($archivo['name'], PATHINFO_FILENAME));
        $safeBaseName = preg_replace('/[^a-z0-9-_]+/', '-', $baseName);
        $safeBaseName = trim($safeBaseName, '-');
        $safeBaseName = substr($safeBaseName ?: 'archivo', 0, 80);
        $generatedName = time() . '-' . $safeBaseName . ($extension ? '.' . $extension : '');

        $savedFilePath = $uploadsDir . '/' . $generatedName;
        $publicFilePath = (rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') ?: '') . '/../uploads/' . $generatedName;
        $publicFilePath = str_replace('/api/../', '/', $publicFilePath);
        $originalName = $archivo['name'];
        $fileSize = $archivo['size'];

        if (!move_uploaded_file($archivo['tmp_name'], $savedFilePath)) {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo guardar el archivo']);
            exit;
        }
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO contenido (titulo, slug, cuerpo, autor_id, tipo_id, estado)
         VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$titulo, $slug, $cuerpo, $user['id'], $tipo_id, $estado]);
        $contenidoId = $pdo->lastInsertId();

        if ($savedFilePath && $publicFilePath) {
            $stmt = $pdo->prepare("INSERT INTO archivos
                (nombre_original, ruta, mime_type, size, entidad_tipo, entidad_id)
                VALUES (?, ?, ?, ?, 'contenido', ?)");
            $stmt->execute([$originalName, $publicFilePath, $fileMimeType, $fileSize, $contenidoId]);
        }

        $pdo->commit();
        http_response_code(201);
        echo json_encode([
            'message' => 'Contenido creado',
            'archivo' => $publicFilePath ? [
                'nombre' => $originalName,
                'url' => $publicFilePath,
                'mimeType' => $fileMimeType,
                'size' => $fileSize,
            ] : null
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($savedFilePath && file_exists($savedFilePath)) {
            unlink($savedFilePath);
        }
        http_response_code(400);
        echo json_encode(['error' => 'Error al crear contenido (posible slug duplicado)']);
    }
    exit;
}
