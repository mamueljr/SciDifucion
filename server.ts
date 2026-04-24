import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "sci-difusion-secret-key-2024";
const db = new Database("database.sqlite");

// --- Database Initialization (SQLite implementation of the MySQL design) ---
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT
    );

    CREATE TABLE IF NOT EXISTS permisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT
    );

    CREATE TABLE IF NOT EXISTS roles_permisos (
      rol_id INTEGER,
      permiso_id INTEGER,
      PRIMARY KEY (rol_id, permiso_id),
      FOREIGN KEY (rol_id) REFERENCES roles(id),
      FOREIGN KEY (permiso_id) REFERENCES permisos(id)
    );

    CREATE TABLE IF NOT EXISTS usuarios_roles (
      usuario_id INTEGER,
      rol_id INTEGER,
      PRIMARY KEY (usuario_id, rol_id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (rol_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS tipos_contenido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS contenido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      cuerpo TEXT,
      autor_id INTEGER,
      tipo_id INTEGER,
      estado TEXT DEFAULT 'borrador',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (autor_id) REFERENCES usuarios(id),
      FOREIGN KEY (tipo_id) REFERENCES tipos_contenido(id)
    );
  `);

  // Seed initial data if empty
  const rolesCount = db.prepare("SELECT count(*) as count FROM roles").get() as any;
  if (rolesCount.count === 0) {
    db.exec(`
      INSERT INTO roles (nombre, descripcion) VALUES 
      ('admin', 'Administrador'), ('investigador', 'Investigador'), ('publico', 'Publico');

      INSERT INTO permisos (nombre) VALUES 
      ('contenido.crear'), ('contenido.eliminar'), ('sala_virtual.acceso');

      -- Admin has all
      INSERT INTO roles_permisos (rol_id, permiso_id) VALUES (1, 1), (1, 2), (1, 3);
      -- Investigador has create and access
      INSERT INTO roles_permisos (rol_id, permiso_id) VALUES (2, 1), (2, 3);
      -- Publico has nothing special
      
      INSERT INTO tipos_contenido (nombre, slug) VALUES 
      ('Artículo', 'articulo'), ('Video', 'video'), ('Podcast', 'podcast');
    `);
  }
}

initDb();

// --- Auth Middleware ---
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ error: "Token inválido" });
  }
};

const authorize = (permiso: string) => {
  return (req: any, res: any, next: any) => {
    const userId = req.user.id;
    // Check if user has a role that has this permission
    const hasPermission = db.prepare(`
      SELECT 1 FROM usuarios_roles ur
      JOIN roles_permisos rp ON ur.rol_id = rp.rol_id
      JOIN permisos p ON rp.permiso_id = p.id
      WHERE ur.usuario_id = ? AND p.nombre = ?
    `).get(userId, permiso);

    if (!hasPermission && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permiso insuficiente: " + permiso });
    }
    next();
  };
};

// --- Server Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- API Routes ---

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { nombre, email, password, role = 'publico' } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const info = db.prepare(
        "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)"
      ).run(nombre, email, hashedPassword);
      
      const rol = db.prepare("SELECT id FROM roles WHERE nombre = ?").get(role) as any;
      if (rol) {
        db.prepare("INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)").run(info.lastInsertRowid, rol.id);
      }

      res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (err: any) {
      res.status(400).json({ error: "El email ya existe o datos inválidos" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const roles = db.prepare(`
      SELECT r.nombre FROM roles r
      JOIN usuarios_roles ur ON r.id = ur.rol_id
      WHERE ur.usuario_id = ?
    `).all(user.id) as any[];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: roles[0]?.nombre || 'publico' },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: 'strict' });
    res.json({ message: "Login exitoso", user: { id: user.id, nombre: user.nombre, email: user.email, role: roles[0]?.nombre } });
  });

  // Auth: Me
  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logout exitoso" });
  });

  // Content: List
  app.get("/api/contenido", (req, res) => {
    const content = db.prepare(`
      SELECT c.*, u.nombre as autor, t.nombre as tipo 
      FROM contenido c
      JOIN usuarios u ON c.autor_id = u.id
      JOIN tipos_contenido t ON c.tipo_id = t.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(content);
  });

  // Content: Create (Only Investigador/Admin)
  app.post("/api/contenido", authenticate, authorize('contenido.crear'), (req: any, res) => {
    const { titulo, cuerpo, tipo_id, estado = 'publicado' } = req.body;
    const slug = titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    try {
      db.prepare(`
        INSERT INTO contenido (titulo, slug, cuerpo, autor_id, tipo_id, estado)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(titulo, slug, cuerpo, req.user.id, tipo_id, estado);
      res.status(201).json({ message: "Contenido creado" });
    } catch (err) {
      res.status(400).json({ error: "Error al crear contenido (posible slug duplicado)" });
    }
  });

  // Admin access to logs (Dummy for demo)
  app.get("/api/admin/stats", authenticate, authorize('usuarios.gestionar'), (req, res) => {
    const stats = {
      usuarios: db.prepare("SELECT count(*) as count FROM usuarios").get(),
      contenido: db.prepare("SELECT count(*) as count FROM contenido").get()
    };
    res.json(stats);
  });

  // --- Vite / Frontend Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SciDifusión backend running on http://localhost:${PORT}`);
  });
}

startServer();
