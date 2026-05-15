import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "sci-difusion-secret-key-2024";
const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["application/pdf", "documento"],
  ["image/jpeg", "imagen"],
  ["image/png", "imagen"],
  ["image/webp", "imagen"],
  ["audio/mpeg", "audio"],
  ["audio/wav", "audio"],
  ["video/mp4", "video"],
]);

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "archivo";

    cb(null, `${Date.now()}-${safeBaseName}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Tipo de archivo no permitido"));
      return;
    }
    cb(null, true);
  },
});

// --- Server Setup ---
async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(UPLOADS_DIR));

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

  // Optional Auth Middleware
  const optionalAuth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (token) {
      try {
        req.user = jwt.verify(token, JWT_SECRET) as any;
      } catch (err) {}
    }
    next();
  };

  // Content: List (public)
  app.get("/api/contenido", optionalAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 0;
      let whereClause = "WHERE c.estado = 'publicado'";
      const params: any[] = [userId];

      if (req.user) {
        whereClause += " OR c.autor_id = ?";
        params.push(req.user.id);
      }

      const [rows]: any = await pool.execute(
        `SELECT c.id, c.titulo, c.cuerpo, c.estado, c.created_at, c.autor_id, c.tipo_id,
                u.nombre AS autor, t.nombre AS tipo, r.nombre AS autor_rol,
                a.nombre_original AS archivo_nombre, a.ruta AS archivo_url, a.mime_type AS archivo_mime_type,
                COALESCE(l.likes_count, 0) AS likes_count,
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
         LEFT JOIN contenido_likes cl_user ON c.id = cl_user.contenido_id AND cl_user.usuario_id = ?
         ${whereClause}
         ORDER BY likes_count DESC, 
                  CASE r.nombre 
                     WHEN 'admin' THEN 3 
                     WHEN 'investigador' THEN 2 
                     ELSE 1 
                  END DESC, 
                  c.created_at DESC`,
        params
      );
      
      const mappedRows = rows.map((row: any) => ({
          ...row,
          user_liked: Boolean(row.user_liked),
          likes_count: Number(row.likes_count)
      }));
      res.json(mappedRows);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener contenido" });
    }
  });

  // Content: Like
  app.post("/api/like", authenticate, async (req: any, res) => {
    try {
      const { contenido_id } = req.body;
      if (!contenido_id) return res.status(400).json({ error: "ID inválido" });
      
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
          const [existing]: any = await connection.execute(
              "SELECT id FROM contenido_likes WHERE contenido_id = ? AND usuario_id = ?",
              [contenido_id, req.user.id]
          );
          
          let liked = false;
          if (existing.length > 0) {
              await connection.execute("DELETE FROM contenido_likes WHERE id = ?", [existing[0].id]);
          } else {
              await connection.execute("INSERT INTO contenido_likes (contenido_id, usuario_id) VALUES (?, ?)", [contenido_id, req.user.id]);
              liked = true;
          }
          
          const [countRes]: any = await connection.execute(
              "SELECT COUNT(*) AS total_likes FROM contenido_likes WHERE contenido_id = ?",
              [contenido_id]
          );
          
          await connection.commit();
          res.json({
              message: liked ? "Like agregado" : "Like removido",
              liked,
              likes_count: Number(countRes[0].total_likes)
          });
      } catch (err) {
          await connection.rollback();
          throw err;
      } finally {
          connection.release();
      }
    } catch (err) {
      res.status(500).json({ error: "Error al procesar el me gusta" });
    }
  });

  // Content: Create (Investigador / Admin)
  app.post(
    "/api/contenido",
    authenticate,
    authorize("contenido.crear"),
    upload.single("archivo"),
    async (req: any, res) => {
      const { titulo, cuerpo, tipo_id, estado = "publicado" } = req.body;
      const archivo = req.file;

      if (!titulo || !cuerpo || !tipo_id) {
        if (archivo) {
          fs.unlink(archivo.path, () => undefined);
        }
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const parsedTypeId = Number(tipo_id);
      if (!Number.isInteger(parsedTypeId) || parsedTypeId < 1) {
        if (archivo) {
          fs.unlink(archivo.path, () => undefined);
        }
        return res.status(400).json({ error: "tipo_id inválido" });
      }

      const normalizedState =
        estado === "borrador" || estado === "archivado" ? estado : "publicado";

      const slug = titulo
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result]: any = await connection.execute(
          `INSERT INTO contenido (titulo, slug, cuerpo, autor_id, tipo_id, estado)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [titulo, slug, cuerpo, req.user.id, parsedTypeId, normalizedState]
        );

        const contenidoId = result.insertId;

        if (archivo) {
          await connection.execute(
            `INSERT INTO archivos
             (nombre_original, ruta, mime_type, size, entidad_tipo, entidad_id)
             VALUES (?, ?, ?, ?, 'contenido', ?)`,
            [
              archivo.originalname,
              `/uploads/${archivo.filename}`,
              archivo.mimetype,
              archivo.size,
              contenidoId,
            ]
          );
        }

        await connection.commit();
        res.status(201).json({
          message: "Contenido creado",
          archivo: archivo
            ? {
                nombre: archivo.originalname,
                url: `/uploads/${archivo.filename}`,
                mimeType: archivo.mimetype,
                size: archivo.size,
              }
            : null,
        });
      } catch (err) {
        if (connection) {
          await connection.rollback();
        }
        if (archivo) {
          fs.unlink(archivo.path, () => undefined);
        }
        res.status(400).json({ error: "Error al crear contenido (posible slug duplicado)" });
      } finally {
        connection?.release();
      }
    }
  );

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

  app.use((err: any, _req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "El archivo supera el límite de 20 MB" });
      }
      return res.status(400).json({ error: err.message });
    }

    if (err?.message === "Tipo de archivo no permitido") {
      return res.status(400).json({
        error: "Formato no permitido. Usa PDF, JPG, PNG, WebP, MP3, WAV o MP4",
      });
    }

    next(err);
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
