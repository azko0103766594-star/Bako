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
import webpush from "web-push";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ========== WEB PUSH (VAPID) ==========
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@align.app";
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log("Web Push VAPID configuré");
} else {
  console.warn("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquants → push désactivé");
}

async function sendPushToUsers(userIds, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE || !userIds || !userIds.length) return;
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const subs = await query(
      `SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`,
      ids
    );
    const body = JSON.stringify(payload);
    await Promise.all(
      (subs.rows || []).map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            body
          );
        } catch (err) {
          const code = err && (err.statusCode || err.status);
          if (code === 404 || code === 410) {
            await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [s.endpoint]).catch(() => {});
          } else {
            console.warn("push fail", code || err.message);
          }
        }
      })
    );
  } catch (e) {
    console.warn("sendPushToUsers", e.message);
  }
}

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

// Serve uploaded files (MIME correct – important pour Samsung)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    const lower = (filePath || "").toLowerCase();
    // Samsung <audio> refuse souvent video/webm → on force audio/webm pour .webm
    // (les vidéos webm restent lisibles via <video> qui accepte audio/webm aussi)
    if (lower.endsWith(".webm") || lower.endsWith(".weba")) {
      res.setHeader("Content-Type", "audio/webm");
    } else if (lower.endsWith(".ogg") || lower.endsWith(".oga")) {
      res.setHeader("Content-Type", "audio/ogg");
    } else if (lower.endsWith(".mp3")) {
      res.setHeader("Content-Type", "audio/mpeg");
    } else if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) {
      res.setHeader("Content-Type", "video/mp4");
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  }
}));

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
  const apiUrl = process.env.API_URL;

  if (!clientId || !apiUrl) {
    console.error("Configuration Google manquante :", {
      clientIdPresent: !!clientId,
      apiUrlPresent: !!apiUrl,
    });
    return res.status(500).send("Configuration de connexion manquante.");
  }

  const redirectUri = `${apiUrl}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

app.get("/api/auth/callback", async (req, res) => {
  const code = req.query.code;
  const frontend = process.env.FRONTEND_URL;
  const apiUrl = process.env.API_URL;

  if (!frontend || !apiUrl) {
    console.error("FRONTEND_URL ou API_URL manquant.");
    return res.status(500).send("Configuration du serveur incomplète.");
  }

  if (req.query.error) {
    console.error("Google a refusé la connexion :", req.query.error);
    return res.redirect(
      `${frontend}?error=${encodeURIComponent(req.query.error)}`
    );
  }

  if (!code || typeof code !== "string") {
    console.error("Google n'a pas renvoyé de code de connexion.");
    return res.redirect(`${frontend}?error=no_code`);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant.");
    return res.redirect(`${frontend}?error=oauth_config`);
  }

  const redirectUri = `${apiUrl}/api/auth/callback`;

  try {
    const tokenRes = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokens = await tokenRes.json();

    if (!tokenRes.ok || !tokens.access_token) {
      // Diagnostic sans afficher le secret ni le code de connexion.
      console.error("Erreur échange Google :", {
        status: tokenRes.status,
        error: tokens.error || "unknown_error",
        description: tokens.error_description || "Aucune description",
      });

      return res.redirect(`${frontend}?error=token_failed`);
    }

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userRes.ok) {
      console.error("Impossible de récupérer le profil Google :", {
        status: userRes.status,
      });
      return res.redirect(`${frontend}?error=userinfo_failed`);
    }

    const gUser = await userRes.json();

    if (!gUser.email) {
      console.error("Le profil Google ne contient pas d'adresse e-mail.");
      return res.redirect(`${frontend}?error=no_email`);
    }

    let user = await queryOne(
      "SELECT * FROM users WHERE email = $1",
      [gUser.email]
    );

    if (!user) {
      const id = uid();
      const pcode = personalCode();

      await query(
        `INSERT INTO users
          (id, email, firstname, avatar_url, personal_code)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          gUser.email,
          gUser.given_name || "",
          gUser.picture || "",
          pcode,
        ]
      );

      user = await queryOne(
        "SELECT * FROM users WHERE id = $1",
        [id]
      );
    }

    if (!user) {
      throw new Error("Utilisateur introuvable après création.");
    }

    const sessionToken = uuidv4() + uuidv4();
    const tokenHash = await hashToken(sessionToken);
    const expires = now() + 60 * 60 * 24 * 30;

    await query(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [tokenHash, user.id, expires]
    );

    // Le jeton est transmis au frontend pour initialiser la session.
    const isNew = user.username ? "0" : "1";

    return res.redirect(
      `${frontend}?token=${encodeURIComponent(sessionToken)}&new=${isNew}`
    );
  } catch (err) {
    // Ne jamais journaliser les secrets ou les jetons.
    console.error("Erreur serveur pendant la connexion Google :", {
      message: err.message,
    });

    return res.redirect(`${frontend}?error=server`);
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

  await query(
    "DELETE FROM sessions WHERE token = $1",
    [tokenHash]
  );

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
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Nom obligatoire" });

    const id = uid();
    const code = personalCode();
    const avatar = req.body.avatar || req.body.avatar_url || null;

    try {
      await query(
        "INSERT INTO spaces (id, name, description, code, owner_id, avatar_url) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, name, req.body.description || "", code, req.user.id, avatar]
      );
    } catch (colErr) {
      // colonne avatar_url absente → insert sans
      await query(
        "INSERT INTO spaces (id, name, description, code, owner_id) VALUES ($1, $2, $3, $4, $5)",
        [id, name, req.body.description || "", code, req.user.id]
      );
    }
    await query(
      "INSERT INTO space_members (space_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [id, req.user.id]
    );

    res.json({ id, name, code, description: req.body.description || "", avatar_url: avatar });
  } catch (e) {
    console.error("create space", e);
    res.status(500).json({ error: e.message || "Erreur création espace" });
  }
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
    `SELECT u.id, u.firstname, u.username, u.avatar_url, u.personal_code
     FROM space_members m JOIN users u ON u.id = m.user_id
     WHERE m.space_id = $1`,
    [req.params.id]
  );

  res.json({ ...space, members: members.rows });
});

// ========== MESSAGES (SPACE) ==========
app.get("/api/spaces/:id/messages", withAuth, async (req, res) => {
  try {
    const thread = (req.query.thread || "").trim(); // optionnel
    let result;
    if (thread) {
      result = await query(
        `SELECT m.*, u.firstname as author_name, u.avatar_url as author_avatar
         FROM messages m JOIN users u ON u.id = m.author_id
         WHERE m.space_id = $1
           AND COALESCE(m.deleted_for_all, 0) = 0
           AND COALESCE(m.thread, 'general') = $2
         ORDER BY m.created_at ASC LIMIT 200`,
        [req.params.id, thread]
      );
    } else {
      result = await query(
        `SELECT m.*, u.firstname as author_name, u.avatar_url as author_avatar
         FROM messages m JOIN users u ON u.id = m.author_id
         WHERE m.space_id = $1 AND COALESCE(m.deleted_for_all, 0) = 0
         ORDER BY m.created_at ASC LIMIT 300`,
        [req.params.id]
      );
    }
    res.json({ messages: result.rows });
  } catch (e) {
    console.error("GET space messages", e);
    res.status(500).json({ error: e.message || "Erreur", messages: [] });
  }
});

app.post("/api/spaces/:id/messages", withAuth, async (req, res) => {
  try {
    const id = uid();
    const thread = (req.body.thread || "general").trim();
    const allowed = ["general", "organisation", "blabla"];
    const safeThread = allowed.includes(thread) ? thread : "general";

    try {
      await query(
        `INSERT INTO messages (id, space_id, author_id, content, type, media_url, duration, thread)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          req.params.id,
          req.user.id,
          req.body.text || "",
          req.body.type || "text",
          req.body.media || null,
          req.body.duration || null,
          safeThread,
        ]
      );
    } catch (e1) {
      // Fallback si colonne thread absente (ancien schéma)
      console.warn("insert with thread failed, retry without", e1.message);
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
    }
    // Push aux membres de l'espace (sauf l'auteur)
    try {
      const members = await query(
        "SELECT user_id FROM space_members WHERE space_id = $1 AND user_id <> $2",
        [req.params.id, req.user.id]
      );
      const author = req.user.firstname || req.user.username || "Quelqu'un";
      const t = req.body.type || "text";
      let body = req.body.text || "";
      if (t === "image") body = "📷 Image";
      else if (t === "video") body = "🎥 Vidéo";
      else if (t === "audio") body = "🎤 Vocal";
      else if (!body) body = "Nouveau message";
      sendPushToUsers(
        (members.rows || []).map((r) => r.user_id),
        { title: author, body, url: "/", tag: "space-" + req.params.id }
      );
    } catch (pe) {
      console.warn("push space", pe.message);
    }

    res.json({ id, ok: true, thread: safeThread });
  } catch (e) {
    console.error("POST space message", e);
    res.status(500).json({ error: e.message || "Erreur envoi message" });
  }
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

/** Code stable unique pour une paire d'utilisateurs (jamais le personal_code) */
function pairChatCode(idA, idB) {
  const ids = [String(idA), String(idB)].sort();
  return ("p" + ids[0].replace(/-/g, "").slice(0, 8) + ids[1].replace(/-/g, "").slice(0, 7)).slice(0, 16);
}

async function ensurePrivateChat(userId, other) {
  // Chat déjà existant entre ces 2 users ?
  let chat = await queryOne(
    `SELECT * FROM private_chats
     WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
    [userId, other.id]
  );
  if (chat) return chat;

  const code = pairChatCode(userId, other.id);
  const name = other.firstname || other.username || "Ami";
  const avatar = other.avatar_url || null;

  // INSERT minimal d'abord (compatible anciennes tables)
  try {
    await query(
      `INSERT INTO private_chats (code, user_a, user_b, other_name, other_avatar)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO NOTHING`,
      [code, userId, other.id, name, avatar]
    );
  } catch (e1) {
    // Fallback si colonnes other_name / other_avatar absentes
    console.warn("private_chats insert full failed, try minimal", e1.message);
    await query(
      `INSERT INTO private_chats (code, user_a, user_b)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO NOTHING`,
      [code, userId, other.id]
    );
  }

  chat = await queryOne(
    `SELECT * FROM private_chats
     WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
    [userId, other.id]
  );
  // Si toujours rien (conflit rare), forcer un code unique
  if (!chat) {
    const fallback = pairChatCode(userId, other.id) + "x";
    await query(
      `INSERT INTO private_chats (code, user_a, user_b)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO NOTHING`,
      [fallback, userId, other.id]
    );
    chat = await queryOne(
      `SELECT * FROM private_chats
       WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
      [userId, other.id]
    );
  }
  return chat;
}

app.post("/api/private/start", withAuth, async (req, res) => {
  try {
    let other = null;
    const codeIn = (req.body.code || "").trim();
    const userId = String(req.body.userId || "").trim();

    // Accepte code personnel OU userId (clic membre groupe)
    if (userId) {
      other = await queryOne("SELECT * FROM users WHERE id = $1", [userId]);
      if (!other) return res.status(404).json({ error: "Utilisateur introuvable" });
    } else if (codeIn) {
      other = await queryOne("SELECT * FROM users WHERE personal_code = $1", [codeIn]);
      if (!other) return res.status(404).json({ error: "Code introuvable" });
    } else {
      return res.status(400).json({ error: "code ou userId requis" });
    }

    if (String(other.id) === String(req.user.id)) {
      return res.status(400).json({ error: "C'est ton propre compte" });
    }

    // Backfill personal_code si manquant (anciens comptes)
    if (!other.personal_code) {
      try {
        const pcode = personalCode();
        await query(
          "UPDATE users SET personal_code = $1 WHERE id = $2 AND (personal_code IS NULL OR personal_code = '')",
          [pcode, other.id]
        );
        other.personal_code = pcode;
      } catch (e) {
        console.warn("backfill personal_code", e.message);
      }
    }

    const chat = await ensurePrivateChat(req.user.id, other);
    if (!chat || !chat.code) {
      return res.status(500).json({ error: "Impossible de créer le chat" });
    }

    res.json({
      code: chat.code,
      otherName: other.firstname || other.username || chat.other_name || "Ami",
      otherAvatar: other.avatar_url || chat.other_avatar || null,
      otherId: other.id,
    });
  } catch (e) {
    console.error("private/start", e);
    res.status(500).json({ error: e.message || "Erreur serveur" });
  }
});

// Démarrer un chat privé via userId (membre d'espace) — AVANT les routes :code
app.post("/api/private/start-user", withAuth, async (req, res) => {
  try {
    const userId = String(req.body.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "userId requis" });
    if (userId === String(req.user.id)) {
      return res.status(400).json({ error: "C'est ton propre compte" });
    }
    const other = await queryOne("SELECT * FROM users WHERE id = $1", [userId]);
    if (!other) return res.status(404).json({ error: "Utilisateur introuvable" });

    if (!other.personal_code) {
      try {
        const pcode = personalCode();
        await query(
          "UPDATE users SET personal_code = $1 WHERE id = $2 AND (personal_code IS NULL OR personal_code = '')",
          [pcode, other.id]
        );
        other.personal_code = pcode;
      } catch (e) {
        console.warn("backfill personal_code", e.message);
      }
    }

    const chat = await ensurePrivateChat(req.user.id, other);
    if (!chat || !chat.code) {
      return res.status(500).json({ error: "Impossible de créer le chat" });
    }

    res.json({
      code: chat.code,
      otherName: other.firstname || other.username || chat.other_name || "Ami",
      otherAvatar: other.avatar_url || chat.other_avatar || null,
      otherId: other.id,
    });
  } catch (e) {
    console.error("start-user", e);
    res.status(500).json({ error: e.message || "Erreur serveur" });
  }
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

  // Push à l'autre participant
  try {
    const chat = await queryOne(
      "SELECT user_a, user_b FROM private_chats WHERE code = $1",
      [req.params.code]
    );
    if (chat) {
      const other =
        String(chat.user_a) === String(req.user.id) ? chat.user_b : chat.user_a;
      const author = req.user.firstname || req.user.username || "Quelqu'un";
      const t = req.body.type || "text";
      let body = req.body.text || "";
      if (t === "image") body = "📷 Image";
      else if (t === "video") body = "🎥 Vidéo";
      else if (t === "audio") body = "🎤 Vocal";
      else if (!body) body = "Nouveau message";
      sendPushToUsers([other], {
        title: author,
        body,
        url: "/",
        tag: "private-" + req.params.code,
      });
    }
  } catch (pe) {
    console.warn("push private", pe.message);
  }

  res.json({ id, ok: true });
});

// Marquer les messages privés comme lus (l'autre a ouvert le chat)
app.post("/api/private/:code/read", withAuth, async (req, res) => {
  try {
    await query(
      `UPDATE messages
       SET read_at = $1
       WHERE private_code = $2
         AND author_id <> $3
         AND (read_at IS NULL OR read_at = 0)`,
      [now(), req.params.code, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Erreur" });
  }
});


// ========== DELETE MESSAGE ==========
app.delete("/api/messages/:id", withAuth, async (req, res) => {
  try {
    const msgId = req.params.id;
    const forEveryone = !!(req.body && req.body.forEveryone);

    const msg = await queryOne("SELECT * FROM messages WHERE id = $1", [msgId]);
    if (!msg) return res.status(404).json({ error: "Message introuvable" });

    if (forEveryone) {
      // Seul l'auteur peut supprimer pour tout le monde
      if (String(msg.author_id) !== String(req.user.id)) {
        return res.status(403).json({ error: "Seul l'auteur peut supprimer pour tout le monde" });
      }
      await query(
        "UPDATE messages SET deleted_for_all = 1, content = '', media_url = NULL WHERE id = $1",
        [msgId]
      );
    } else {
      // Soft delete côté client seulement — on marque juste côté serveur si besoin
      // (la suppression "pour moi" reste locale)
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Erreur" });
  }
});

// ========== PUSH SUBSCRIPTIONS ==========
app.get("/api/push/vapid-public", (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC || "" });
});

app.post("/api/push/subscribe", withAuth, async (req, res) => {
  try {
    const sub = req.body || {};
    if (!sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return res.status(400).json({ error: "Subscription invalide" });
    }
    const id = uid();
    await query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent`,
      [
        id,
        req.user.id,
        sub.endpoint,
        sub.keys.p256dh,
        sub.keys.auth,
        req.headers["user-agent"] || "",
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("push subscribe", e);
    res.status(500).json({ error: e.message || "Erreur" });
  }
});

app.delete("/api/push/subscribe", withAuth, async (req, res) => {
  try {
    const endpoint = req.body && req.body.endpoint;
    if (endpoint) {
      await query(
        "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
        [req.user.id, endpoint]
      );
    } else {
      await query("DELETE FROM push_subscriptions WHERE user_id = $1", [req.user.id]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Erreur" });
  }
});

// Test push pour l'utilisateur connecté
app.post("/api/push/test", withAuth, async (req, res) => {
  try {
    const subs = await query(
      "SELECT endpoint FROM push_subscriptions WHERE user_id = $1",
      [req.user.id]
    );
    const count = (subs.rows || []).length;
    if (!count) {
      return res.json({
        ok: false,
        sent: false,
        error: "Aucun abonnement enregistré. Réactive les notifications.",
      });
    }
    await sendPushToUsers([req.user.id], {
      title: "Align",
      body: "Test de notification – ça marche !",
      url: "/",
      tag: "align-test",
    });
    res.json({ ok: true, sent: true, subscriptions: count });
  } catch (e) {
    console.error("push test", e);
    res.status(500).json({ error: e.message || "Erreur" });
  }
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
  try {
    const decisionsRes = await query(
      "SELECT * FROM decisions WHERE space_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );

    const decisions = decisionsRes.rows;
    for (const d of decisions) {
      const options = await query(
        "SELECT * FROM decision_options WHERE decision_id = $1 ORDER BY id",
        [d.id]
      );
      // Recount votes from decision_votes (source of truth)
      for (const opt of options.rows) {
        const cnt = await queryOne(
          "SELECT COUNT(*)::int AS c FROM decision_votes WHERE option_id = $1",
          [opt.id]
        );
        opt.votes = (cnt && cnt.c) || 0;
      }
      d.options = options.rows;

      const myVote = await queryOne(
        "SELECT option_id FROM decision_votes WHERE decision_id = $1 AND user_id = $2",
        [d.id, req.user.id]
      );
      d.myOptionId = myVote ? myVote.option_id : null;
    }

    res.json({ decisions });
  } catch (e) {
    console.error("GET decisions", e);
    res.status(500).json({ error: e.message || "Erreur serveur", decisions: [] });
  }
});

app.post("/api/spaces/:id/decisions", withAuth, async (req, res) => {
  try {
    const id = uid();
    const question = (req.body.question || "").trim();
    const options = Array.isArray(req.body.options) ? req.body.options : [];
    if (!question) return res.status(400).json({ error: "Question requise" });
    if (options.length < 2) return res.status(400).json({ error: "Min 2 options" });

    await query(
      "INSERT INTO decisions (id, space_id, question, created_by) VALUES ($1, $2, $3, $4)",
      [id, req.params.id, question, req.user.id]
    );

    const createdOptions = [];
    for (const opt of options) {
      const text = typeof opt === "string" ? opt : (opt && opt.text) || "";
      if (!text.trim()) continue;
      const oid = uid();
      await query(
        "INSERT INTO decision_options (id, decision_id, text, votes) VALUES ($1, $2, $3, 0)",
        [oid, id, text.trim()]
      );
      createdOptions.push({ id: oid, text: text.trim(), votes: 0 });
    }

    res.json({
      id,
      ok: true,
      question,
      options: createdOptions,
    });
  } catch (e) {
    console.error("POST decision", e);
    res.status(500).json({ error: e.message || "Erreur serveur" });
  }
});

app.post("/api/decisions/:id/vote", withAuth, async (req, res) => {
  try {
    const decisionId = req.params.id;
    const optionId = req.body.optionId;
    if (!optionId) return res.status(400).json({ error: "optionId requis" });

    // Vérifier que l'option appartient à cette décision
    const opt = await queryOne(
      "SELECT id FROM decision_options WHERE id = $1 AND decision_id = $2",
      [optionId, decisionId]
    );
    if (!opt) return res.status(404).json({ error: "Option introuvable" });

    await query(
      "DELETE FROM decision_votes WHERE decision_id = $1 AND user_id = $2",
      [decisionId, req.user.id]
    );
    await query(
      "INSERT INTO decision_votes (decision_id, option_id, user_id) VALUES ($1, $2, $3)",
      [decisionId, optionId, req.user.id]
    );

    // Recalculer les votes de TOUTES les options de la décision
    const allOpts = await query(
      "SELECT id FROM decision_options WHERE decision_id = $1",
      [decisionId]
    );
    for (const o of allOpts.rows) {
      await query(
        `UPDATE decision_options
         SET votes = (SELECT COUNT(*) FROM decision_votes WHERE option_id = $1)
         WHERE id = $1`,
        [o.id]
      );
    }

    const updated = await query(
      "SELECT id, text, votes FROM decision_options WHERE decision_id = $1",
      [decisionId]
    );
    res.json({ ok: true, options: updated.rows, myOptionId: optionId });
  } catch (e) {
    console.error("vote", e);
    res.status(500).json({ error: e.message || "Erreur serveur" });
  }
});

// ========== SPACES ==========

// Afficher les espaces dont l'utilisateur est membre
app.get("/api/spaces", withAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*
       FROM spaces s
       INNER JOIN space_members m ON m.space_id = s.id
       WHERE m.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );

    res.json({ spaces: result.rows });
  } catch (error) {
    next(error);
  }
});

// Générer un code d'espace unique à 6 chiffres
async function generateSpaceCode() {
  for (let i = 0; i < 20; i++) {
    const code = personalCode();

    const existing = await queryOne(
      "SELECT id FROM spaces WHERE code = $1",
      [code]
    );

    if (!existing) return code;
  }

  throw new Error("Impossible de générer un code unique.");
}

// Créer un espace
app.post("/api/spaces", withAuth, async (req, res, next) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (!name) {
      return res.status(400).json({
        error: "Le nom de l'espace est obligatoire."
      });
    }

    const id = uid();
    const code = await generateSpaceCode();

    await query(
      `INSERT INTO spaces
       (id, name, description, code, owner_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, description, code, req.user.id]
    );

    await query(
      `INSERT INTO space_members (space_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, req.user.id]
    );

    res.status(201).json({
      id,
      name,
      description,
      code
    });
  } catch (error) {
    next(error);
  }
});

// Rejoindre un espace avec son code
app.post("/api/spaces/join", withAuth, async (req, res, next) => {
  try {
    const code =
      typeof req.body.code === "string"
        ? req.body.code.trim()
        : "";

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: "Le code doit contenir exactement 6 chiffres."
      });
    }

    const space = await queryOne(
      "SELECT * FROM spaces WHERE code = $1",
      [code]
    );

    if (!space) {
      return res.status(404).json({
        error: "Code invalide. Vérifie le code envoyé par le créateur."
      });
    }

    await query(
      `INSERT INTO space_members (space_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [space.id, req.user.id]
    );

    res.json({
      ok: true,
      space
    });
  } catch (error) {
    next(error);
  }
});

// Récupérer les détails d'un espace
app.get("/api/spaces/:id", withAuth, async (req, res, next) => {
  try {
    const space = await queryOne(
      "SELECT * FROM spaces WHERE id = $1",
      [req.params.id]
    );

    if (!space) {
      return res.status(404).json({
        error: "Espace introuvable."
      });
    }

    const member = await queryOne(
      `SELECT 1 FROM space_members
       WHERE space_id = $1 AND user_id = $2`,
      [space.id, req.user.id]
    );

    if (!member) {
      return res.status(403).json({
        error: "Tu n'es pas membre de cet espace."
      });
    }

    const members = await query(
      `SELECT u.id, u.firstname, u.username, u.avatar_url, u.personal_code
       FROM space_members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.space_id = $1`,
      [space.id]
    );

    res.json({
      ...space,
      members: members.rows
    });
  } catch (error) {
    next(error);
  }
});

// ========== CALLS (WebRTC signaling) ==========

/** Résout le callee pour un appel privé (via personal_code) ou espace (premier autre membre). */
async function resolveCallee(context, privateCode, spaceId, callerId) {
  if (context === "private") {
    if (!privateCode) return null;
    // private_chats: user_a / user_b, ou bien l'autre via users.personal_code
    const other = await queryOne(
      "SELECT id, firstname, avatar_url FROM users WHERE personal_code = $1",
      [privateCode]
    );
    if (!other || other.id === callerId) return null;
    return other;
  }
  if (context === "space") {
    if (!spaceId) return null;
    // Pour un appel 1:1 dans un espace, on prend le premier autre membre
    // (extension multi-partie possible plus tard)
    const row = await queryOne(
      `SELECT u.id, u.firstname, u.avatar_url
       FROM space_members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.space_id = $1 AND m.user_id <> $2
       LIMIT 1`,
      [spaceId, callerId]
    );
    return row;
  }
  return null;
}

// Démarrer un appel sortant
app.post("/api/calls/start", withAuth, async (req, res, next) => {
  try {
    const type = req.body.type === "video" ? "video" : "audio";
    const context = req.body.context === "space" ? "space" : "private";
    const privateCode = req.body.privateCode || null;
    const spaceId = req.body.spaceId || null;

    const callee = await resolveCallee(context, privateCode, spaceId, req.user.id);
    if (!callee) {
      return res.status(400).json({
        error: context === "private"
          ? "Destinataire introuvable (code invalide)."
          : "Aucun autre membre dans cet espace.",
      });
    }

    const id = uid();
    await query(
      `INSERT INTO calls (id, type, context, private_code, space_id, caller_id, callee_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ringing')`,
      [id, type, context, privateCode, spaceId, req.user.id, callee.id]
    );

    res.json({
      callId: id,
      calleeId: callee.id,
      calleeName: callee.firstname,
      calleeAvatar: callee.avatar_url || null,
    });
  } catch (e) {
    next(e);
  }
});

// Répondre à un appel
app.post("/api/calls/:id/answer", withAuth, async (req, res, next) => {
  try {
    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    if (call.callee_id !== req.user.id) {
      return res.status(403).json({ error: "Pas destinataire de cet appel" });
    }
    if (call.status !== "ringing") {
      return res.status(400).json({ error: "Appel déjà traité" });
    }
    await query(
      "UPDATE calls SET status = 'active', updated_at = $1 WHERE id = $2",
      [now(), call.id]
    );
    res.json({ ok: true, callId: call.id });
  } catch (e) {
    next(e);
  }
});

// Refuser un appel
app.post("/api/calls/:id/reject", withAuth, async (req, res, next) => {
  try {
    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    if (call.callee_id !== req.user.id && call.caller_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }
    await query(
      "UPDATE calls SET status = 'rejected', updated_at = $1 WHERE id = $2",
      [now(), call.id]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Terminer un appel
app.post("/api/calls/:id/end", withAuth, async (req, res, next) => {
  try {
    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    if (call.callee_id !== req.user.id && call.caller_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }
    await query(
      "UPDATE calls SET status = 'ended', updated_at = $1 WHERE id = $2",
      [now(), call.id]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Envoyer un signal WebRTC (offer / answer / ice)
app.post("/api/calls/:id/signal", withAuth, async (req, res, next) => {
  try {
    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    if (call.callee_id !== req.user.id && call.caller_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const toUser = req.body.toUser;
    const kind = req.body.kind; // offer | answer | ice
    const payload = req.body.payload;

    if (!toUser || !kind || payload === undefined) {
      return res.status(400).json({ error: "toUser, kind et payload requis" });
    }

    const payloadStr =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    await query(
      `INSERT INTO call_signals (call_id, from_user, to_user, kind, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [call.id, req.user.id, toUser, kind, payloadStr]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Poll : signaux + appels entrants + mes appels
app.get("/api/calls/poll", withAuth, async (req, res, next) => {
  try {
    const afterId = parseInt(req.query.after || "0", 10) || 0;
    const uid = req.user.id;

    // Signaux destinés à moi (après afterId)
    const signalsRes = await query(
      `SELECT id, call_id, from_user, kind, payload, created_at
       FROM call_signals
       WHERE to_user = $1 AND id > $2
       ORDER BY id ASC
       LIMIT 50`,
      [uid, afterId]
    );

    // Appels entrants en sonnerie
    const incomingRes = await query(
      `SELECT c.id, c.type, c.context, c.private_code, c.space_id,
              c.caller_id, c.status, c.created_at,
              u.firstname AS caller_name, u.avatar_url AS caller_avatar
       FROM calls c
       INNER JOIN users u ON u.id = c.caller_id
       WHERE c.callee_id = $1 AND c.status = 'ringing'
         AND c.created_at > $2
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [uid, now() - 60] // ignore appels > 60s
    );

    // Mes appels récents (caller ou callee) pour statut
    const myCallsRes = await query(
      `SELECT id, type, context, caller_id, callee_id, status, created_at, updated_at
       FROM calls
       WHERE (caller_id = $1 OR callee_id = $1)
         AND created_at > $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [uid, now() - 120]
    );

    res.json({
      signals: signalsRes.rows.map((s) => ({
        id: s.id,
        call_id: s.call_id,
        from_user: s.from_user,
        kind: s.kind,
        payload: s.payload,
        created_at: s.created_at,
      })),
      incoming: incomingRes.rows.map((c) => ({
        id: c.id,
        type: c.type,
        context: c.context,
        private_code: c.private_code,
        space_id: c.space_id,
        caller_id: c.caller_id,
        caller_name: c.caller_name,
        caller_avatar: c.caller_avatar,
        status: c.status,
        created_at: c.created_at,
      })),
      myCalls: myCallsRes.rows,
    });
  } catch (e) {
    next(e);
  }
});

// ========== SCHEMA SAFE (colonnes manquantes) ==========
async function ensureSchema() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS private_chats (
        code TEXT PRIMARY KEY,
        user_a TEXT NOT NULL,
        user_b TEXT NOT NULL,
        other_name TEXT,
        other_avatar TEXT,
        pinned INTEGER DEFAULT 0,
        archived INTEGER DEFAULT 0,
        updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `);
    // Ajouter colonnes si table existait sans elles
    await query(`ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS other_name TEXT`).catch(() => {});
    await query(`ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS other_avatar TEXT`).catch(() => {});
    await query(`ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS pinned INTEGER DEFAULT 0`).catch(() => {});
    await query(`ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS archived INTEGER DEFAULT 0`).catch(() => {});
    await query(`ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS updated_at BIGINT`).catch(() => {});
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_code TEXT`).catch(() => {});
    await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread TEXT DEFAULT 'general'`).catch(() => {});
    await query(`UPDATE messages SET thread = 'general' WHERE thread IS NULL`).catch(() => {});

    // Tables décisions / votes
    await query(`
      CREATE TABLE IF NOT EXISTS decisions (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL,
        question TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS decision_options (
        id TEXT PRIMARY KEY,
        decision_id TEXT NOT NULL,
        text TEXT NOT NULL,
        votes INTEGER DEFAULT 0
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS decision_votes (
        decision_id TEXT NOT NULL,
        option_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (decision_id, user_id)
      )
    `);
    console.log("Schema private_chats + decisions OK");
  } catch (e) {
    console.warn("ensureSchema:", e.message);
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ error: err.message || "Erreur serveur" });
});

ensureSchema().then(() => {
  app.listen(PORT, () => {
    console.log("Align API on port", PORT);
  });
}).catch((e) => {
  console.error("Boot failed", e);
  app.listen(PORT, () => {
    console.log("Align API on port", PORT, "(schema skip)");
  });
});
