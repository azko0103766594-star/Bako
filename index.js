/**
 * Align API – Render (Express + PostgreSQL)
 * Auth Google + Postgres + Upload local (ou Cloudinary)
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ========== DATABASE ==========
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res;
}

async function queryOne(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

// ========== HELPERS ==========
function uid() {
  return uuidv4().replace(/-/g, "").slice(0, 16);
}

function personalCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function now() {
  return Math.floor(Date.now() / 1000);
}

// ========== MIDDLEWARE ==========
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// Serve frontend (static files) – everything is at root
const publicDir = __dirname;
app.use(express.static(publicDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || "";
    cb(null, `${unique}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB

// Auth middleware
async function withAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice(7);
  const tokenHash = await hashToken(token);

  const session = await queryOne(
    "SELECT user_id, expires_at FROM sessions WHERE token = $1",
    [tokenHash]
  );

  if (!session || session.expires_at < now()) {
    return res.status(401).json({ error: "Session expired" });
  }

  const user = await queryOne("SELECT * FROM users WHERE id = $1", [session.user_id]);
  if (!user) return res.status(401).json({ error: "User not found" });

  req.user = user;
  req.token = token;
  next();
}

// ========== AUTH ==========
app.get("/api/auth/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.API_URL || `http://localhost:${PORT}`}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get("/api/auth/callback", async (req, res) => {
  const code = req.query.code;
  const frontend = process.env.FRONTEND_URL || "http://localhost:5500";

  if (!code) {
    return res.redirect(`${frontend}?error=no_code`);
  }

  const redirectUri = `${process.env.API_URL || `http://localhost:${PORT}`}/api/auth/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return res.redirect(`${frontend}?error=token_failed`);
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const gUser = await userRes.json();

    if (!gUser.email) {
      return res.redirect(`${frontend}?error=no_email`);
    }

    let user = await queryOne("SELECT * FROM users WHERE email = $1", [gUser.email]);

    if (!user) {
      const id = uid();
      const pcode = personalCode();
      await query(
        `INSERT INTO users (id, email, firstname, avatar_url, personal_code)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, gUser.email, gUser.given_name || "", gUser.picture || "", pcode]
      );
      user = await queryOne("SELECT * FROM users WHERE id = $1", [id]);
    }

    const sessionToken = uuidv4() + uuidv4();
    const tokenHash = await hashToken(sessionToken);
    const expires = now() + 60 * 60 * 24 * 30; // 30 days

    await query(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [tokenHash, user.id, expires]
    );

    res.redirect(`${frontend}?token=${sessionToken}&new=${user.username ? "0" : "1"}`);
  } catch (err) {
    console.error(err);
    res.redirect(`${frontend}?error=server`);
  }
});

app.get("/api/auth/me", withAuth, async (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    email: u.email,
    firstname: u.firstname,
    lastname: u.lastname,
    username: u.username,
    bio: u.bio,
    avatar: u.avatar_url,
    personalCode: u.personal_code,
    ok: !!u.username,
  });
});

app.post("/api/auth/logout", withAuth, async (req, res) => {
  const tokenHash = await hashToken(req.token);
  await query("DELETE FROM sessions WHERE token = $1", [tokenHash]);
  res.json({ ok: true });
});

// ========== PROFILE ==========
app.put("/api/profile", withAuth, async (req, res) => {
  const { firstname, lastname, username, bio, avatar } = req.body;

  if (!firstname || !username || username.length < 3) {
    return res.status(400).json({ error: "Prénom et username (min 3) obligatoires" });
  }

  const existing = await queryOne(
    "SELECT id FROM users WHERE username = $1 AND id != $2",
    [username, req.user.id]
  );
  if (existing) {
    return res.status(400).json({ error: "Ce username est déjà pris" });
  }

  await query(
    `UPDATE users SET firstname=$1, lastname=$2, username=$3, bio=$4, avatar_url=$5, updated_at=$6
     WHERE id=$7`,
    [
      firstname,
      lastname || "",
      username,
      bio || "",
      avatar || req.user.avatar_url,
      now(),
      req.user.id,
    ]
  );

  const user = await queryOne("SELECT * FROM users WHERE id = $1", [req.user.id]);
  res.json({
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    username: user.username,
    bio: user.bio,
    avatar: user.avatar_url,
    personalCode: user.personal_code,
    ok: true,
  });
});

// ========== SPACES ==========
app.get("/api/spaces", withAuth, async (req, res) => {
  const result = await query(
    `SELECT s.* FROM spaces s
     JOIN space_members m ON m.space_id = s.id
     WHERE m.user_id = $1
     ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  res.json({ spaces: result.rows });
});

app.post("/api/spaces", withAuth, async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Nom obligatoire" });

  const id = uid();
  const code = personalCode();

  await query(
    "INSERT INTO spaces (id, name, description, code, owner_id) VALUES ($1, $2, $3, $4, $5)",
    [id, name, req.body.description || "", code, req.user.id]
  );
  await query(
    "INSERT INTO space_members (space_id, user_id) VALUES ($1, $2)",
    [id, req.user.id]
  );

  res.json({ id, name, code, description: req.body.description || "" });
});

app.post("/api/spaces/join", withAuth, async (req, res) => {
  const code = (req.body.code || "").trim();
  const space = await queryOne("SELECT * FROM spaces WHERE code = $1", [code]);
  if (!space) return res.status(404).json({ error: "Code invalide" });

  const member = await queryOne(
    "SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2",
    [space.id, req.user.id]
  );
  if (!member) {
    await query(
      "INSERT INTO space_members (space_id, user_id) VALUES ($1, $2)",
      [space.id, req.user.id]
    );
  }

  res.json({ space });
});

app.get("/api/spaces/:id", withAuth, async (req, res) => {
  const space = await queryOne("SELECT * FROM spaces WHERE id = $1", [req.params.id]);
  if (!space) return res.status(404).json({ error: "Espace introuvable" });

  const members = await query(
    `SELECT u.id, u.firstname, u.username, u.avatar_url
     FROM space_members m JOIN users u ON u.id = m.user_id
     WHERE m.space_id = $1`,
    [req.params.id]
  );

  res.json({ ...space, members: members.rows });
});

// ========== MESSAGES (SPACE) ==========
app.get("/api/spaces/:id/messages", withAuth, async (req, res) => {
  const result = await query(
    `SELECT m.*, u.firstname as author_name, u.avatar_url as author_avatar
     FROM messages m JOIN users u ON u.id = m.author_id
     WHERE m.space_id = $1 AND m.deleted_for_all = 0
     ORDER BY m.created_at ASC LIMIT 200`,
    [req.params.id]
  );
  res.json({ messages: result.rows });
});

app.post("/api/spaces/:id/messages", withAuth, async (req, res) => {
  const id = uid();
  await query(
    `INSERT INTO messages (id, space_id, author_id, content, type, media_url, duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      req.params.id,
      req.user.id,
      req.body.text || "",
      req.body.type || "text",
      req.body.media || null,
      req.body.duration || null,
    ]
  );
  res.json({ id, ok: true });
});

// ========== PRIVATE ==========
app.get("/api/private", withAuth, async (req, res) => {
  const result = await query(
    `SELECT * FROM private_chats
     WHERE user_a = $1 OR user_b = $1
     ORDER BY updated_at DESC`,
    [req.user.id]
  );
  res.json({ chats: result.rows });
});

app.post("/api/private/start", withAuth, async (req, res) => {
  const code = (req.body.code || "").trim();
  const other = await queryOne("SELECT * FROM users WHERE personal_code = $1", [code]);

  if (!other) return res.status(404).json({ error: "Code introuvable" });
  if (other.id === req.user.id) return res.status(400).json({ error: "C'est ton propre code" });

  let chat = await queryOne(
    `SELECT * FROM private_chats
     WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
    [req.user.id, other.id]
  );

  if (!chat) {
    await query(
      `INSERT INTO private_chats (code, user_a, user_b, other_name, other_avatar)
       VALUES ($1, $2, $3, $4, $5)`,
      [code, req.user.id, other.id, other.firstname || other.username, other.avatar_url]
    );
  }

  res.json({
    code,
    otherName: other.firstname || other.username,
    otherAvatar: other.avatar_url,
  });
});

app.get("/api/private/:code/messages", withAuth, async (req, res) => {
  const result = await query(
    `SELECT m.*, u.firstname as author_name
     FROM messages m JOIN users u ON u.id = m.author_id
     WHERE m.private_code = $1 AND m.deleted_for_all = 0
     ORDER BY m.created_at ASC LIMIT 200`,
    [req.params.code]
  );
  res.json({ messages: result.rows });
});

app.post("/api/private/:code/messages", withAuth, async (req, res) => {
  const id = uid();
  await query(
    `INSERT INTO messages (id, private_code, author_id, content, type, media_url, duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      req.params.code,
      req.user.id,
      req.body.text || "",
      req.body.type || "text",
      req.body.media || null,
      req.body.duration || null,
    ]
  );

  await query(
    "UPDATE private_chats SET updated_at = $1 WHERE code = $2",
    [now(), req.params.code]
  );

  res.json({ id, ok: true });
});

// ========== MEDIA ==========
app.post("/api/media/upload", withAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });

  // URL publique de l'API + /uploads/...
  const base = process.env.API_URL || `http://localhost:${PORT}`;
  const url = `${base}/uploads/${req.file.filename}`;

  res.json({ url, key: req.file.filename });
});

// ========== DECISIONS ==========
app.get("/api/spaces/:id/decisions", withAuth, async (req, res) => {
  const decisionsRes = await query(
    "SELECT * FROM decisions WHERE space_id = $1 ORDER BY created_at DESC",
    [req.params.id]
  );

  const decisions = decisionsRes.rows;
  for (const d of decisions) {
    const options = await query(
      "SELECT * FROM decision_options WHERE decision_id = $1",
      [d.id]
    );
    d.options = options.rows;
  }

  res.json({ decisions });
});

app.post("/api/spaces/:id/decisions", withAuth, async (req, res) => {
  const id = uid();
  await query(
    "INSERT INTO decisions (id, space_id, question, created_by) VALUES ($1, $2, $3, $4)",
    [id, req.params.id, req.body.question, req.user.id]
  );

  for (const opt of req.body.options || []) {
    const oid = uid();
    await query(
      "INSERT INTO decision_options (id, decision_id, text) VALUES ($1, $2, $3)",
      [oid, id, opt]
    );
  }

  res.json({ id, ok: true });
});

app.post("/api/decisions/:id/vote", withAuth, async (req, res) => {
  const decisionId = req.params.id;
  const optionId = req.body.optionId;

  await query(
    "DELETE FROM decision_votes WHERE decision_id = $1 AND user_id = $2",
    [decisionId, req.user.id]
  );

  await query(
    "INSERT INTO decision_votes (decision_id, option_id, user_id) VALUES ($1, $2, $3)",
    [decisionId, optionId, req.user.id]
  );

  // Recalcul des votes
  await query(
    `UPDATE decision_options SET votes = (
       SELECT COUNT(*) FROM decision_votes WHERE option_id = decision_options.id
     ) WHERE decision_id = $1`,
    [decisionId]
  );

  res.json({ ok: true });
});

// ========== HEALTH ==========
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Align API", version: "1.0.0" });
});

// SPA fallback – serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ========== START ==========
app.listen(PORT, () => {
  console.log(`Align (Frontend + API) running on port ${PORT}`);
});
