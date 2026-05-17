<?php
require_once '../config.php';
$user = requireAuth();

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT u.id, u.nombre, u.email, u.activo, r.nombre as role 
                         FROM usuarios u 
                         LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id 
                         LEFT JOIN roles r ON ur.rol_id = r.id
                         ORDER BY u.id DESC");
    $users = $stmt->fetchAll();
    echo json_encode($users);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'delete') {
        $id = isset($data['id']) ? (int) $data['id'] : 0;

        if ($id < 1 || $id === (int) $user['id']) {
            http_response_code(400);
            echo json_encode(['error' => 'No puedes eliminar este usuario']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'update_role') {
        $id = isset($data['id']) ? (int) $data['id'] : 0;
        $roleName = $data['role'] ?? '';

        if ($id < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Usuario inválido']);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE nombre = ?");
        $stmt->execute([$roleName]);
        $rol = $stmt->fetch();

        if ($rol) {
            $pdo->prepare("DELETE FROM usuarios_roles WHERE usuario_id = ?")->execute([$id]);
            $pdo->prepare("INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)")->execute([$id, $rol['id']]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Rol inválido']);
        }
        exit;
    }

    if ($action === 'toggle_active') {
        $id = isset($data['id']) ? (int) $data['id'] : 0;
        $active = !empty($data['active']) ? 1 : 0;

        if ($id < 1 || $id === (int) $user['id']) {
            http_response_code(400);
            echo json_encode(['error' => 'No puedes cambiar el estado de este usuario']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE usuarios SET activo = ? WHERE id = ?");
        $stmt->execute([$active, $id]);
        echo json_encode(['success' => true]);
        exit;
    }
}
