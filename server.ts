import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "sci-difusion-secret-key-2024";

// --- MySQL Connection Pool ---
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME     || "u341911188_scidifusion",
  user:     process.env.DB_USER     || "u341911188_erojasdifusion",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

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
  return async (req: any, res: any, next: any) => {
    try {
      const [rows]: any = await pool.execute(
        `SELECT 1 FROM usuarios_roles ur
         JOIN roles_permisos rp ON ur.rol_id = rp.rol_id
         JOIN permisos p ON rp.permiso_id = p.id
         WHERE ur.usuario_id = ? AND p.nombre = ?`,
        [req.user.id, permiso]
      );
      if (!rows.length && req.user.role !== "admin") {
        return res.status(403).json({ error: "Permiso insuficiente: " + permiso });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: "Error de autorización" });
    }
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
      const { nombre, email, password, role = "publico" } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result]: any = await pool.execute(
        "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)",
        [nombre, email, hashedPassword]
      );
      const userId = result.insertId;

      const [roles]: any = await pool.execute(
        "SELECT id FROM roles WHERE nombre = ?",
        [role]
      );
      if (roles.length) {
        await pool.execute(
          "INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)",
          [userId, roles[0].id]
        );
      }

      res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (err: any) {
      res.status(400).json({ error: "El email ya existe o datos inválidos" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const [users]: any = await pool.execute(
        "SELECT * FROM usuarios WHERE email = ?",
        [email]
      );
      const user = users[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const [roles]: any = await pool.execute(
        `SELECT r.nombre FROM roles r
         JOIN usuarios_roles ur ON r.id = ur.rol_id
         WHERE ur.usuario_id = ?`,
        [user.id]
      );
      const roleName = roles[0]?.nombre || "publico";

      const token = jwt.sign(
        { id: user.id, email: user.email, role: roleName },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "strict" });
      res.json({
        message: "Login exitoso",
        user: { id: user.id, nombre: user.nombre, email: user.email, role: roleName },
      });
    } catch (err) {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Auth: Me
  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    try {
      const [rows]: any = await pool.execute(
        "SELECT id, nombre, email FROM usuarios WHERE id = ?",
        [req.user.id]
      );
      const user = rows[0];
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
      res.json({ ...req.user, nombre: user.nombre });
    } catch (err) {
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Auth: Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logout exitoso" });
  });

  // Content: List (public)
  app.get("/api/contenido", async (req, res) => {
    try {
      const [rows]: any = await pool.execute(
        `SELECT c.id, c.titulo, c.cuerpo, c.estado, c.created_at,
                u.nombre AS autor, t.nombre AS tipo
         FROM contenido c
         JOIN usuarios u ON c.autor_id = u.id
         JOIN tipos_contenido t ON c.tipo_id = t.id
         WHERE c.estado = 'publicado'
         ORDER BY c.created_at DESC`
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener contenido" });
    }
  });

  // Content: Create (Investigador / Admin)
  app.post("/api/contenido", authenticate, authorize("contenido.crear"), async (req: any, res) => {
    const { titulo, cuerpo, tipo_id, estado = "publicado" } = req.body;
    const slug = titulo
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    try {
      await pool.execute(
        `INSERT INTO contenido (titulo, slug, cuerpo, autor_id, tipo_id, estado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [titulo, slug, cuerpo, req.user.id, tipo_id, estado]
      );
      res.status(201).json({ message: "Contenido creado" });
    } catch (err) {
      res.status(400).json({ error: "Error al crear contenido (posible slug duplicado)" });
    }
  });

  // Admin: Stats
  app.get("/api/admin/stats", authenticate, authorize("usuarios.gestionar"), async (req, res) => {
    try {
      const [[usuarios]]: any = await pool.execute("SELECT COUNT(*) as count FROM usuarios");
      const [[contenido]]: any = await pool.execute("SELECT COUNT(*) as count FROM contenido");
      res.json({ usuarios, contenido });
    } catch (err) {
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
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
    console.log(`✅ SciDifusión backend running on http://localhost:${PORT}`);
    console.log(`📦 DB: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
