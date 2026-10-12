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

  await query(
    `UPDATE decision_options SET votes = (
       SELECT COUNT(*) FROM decision_votes WHERE option_id = decision_options.id
     ) WHERE decision_id = $1`,
    [decisionId]
  );

  res.json({ ok: true });
});

// ========== CALLS (WebRTC signaling) ==========
app.post("/api/calls/start", withAuth, async (req, res) => {
  try {
    const { type, context, privateCode, spaceId, calleeId } = req.body;
    if (!["audio", "video"].includes(type)) {
      return res.status(400).json({ error: "type invalide" });
    }
    if (!["private", "space"].includes(context)) {
      return res.status(400).json({ error: "context invalide" });
    }

    let targetCalleeId = calleeId || null;

    if (context === "private") {
      if (!privateCode) return res.status(400).json({ error: "privateCode requis" });
      const chat = await queryOne(
        "SELECT * FROM private_chats WHERE code = $1",
        [privateCode]
      );
      if (!chat) return res.status(404).json({ error: "Chat privé introuvable" });
      if (chat.user_a !== req.user.id && chat.user_b !== req.user.id) {
        return res.status(403).json({ error: "Accès refusé" });
      }
      targetCalleeId = chat.user_a === req.user.id ? chat.user_b : chat.user_a;
    } else {
      if (!spaceId) return res.status(400).json({ error: "spaceId requis" });
      const member = await queryOne(
        "SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2",
        [spaceId, req.user.id]
      );
      if (!member) return res.status(403).json({ error: "Pas membre de l'espace" });
    }

    const id = uid();
    await query(
      `INSERT INTO calls (id, type, context, private_code, space_id, caller_id, callee_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ringing', $8)`,
      [
        id,
        type,
        context,
        privateCode || null,
        spaceId || null,
        req.user.id,
        targetCalleeId,
        now(),
      ]
    );

    res.json({
      ok: true,
      callId: id,
      type,
      context,
      calleeId: targetCalleeId,
    });
  } catch (e) {
    console.error("calls/start", e);
    res.status(500).json({ error: "Erreur serveur appel" });
  }
});

app.get("/api/calls/poll", withAuth, async (req, res) => {
  try {
    const uid_ = req.user.id;

    const incoming = await query(
      `SELECT c.*, u.firstname as caller_name, u.avatar_url as caller_avatar
       FROM calls c
       JOIN users u ON u.id = c.caller_id
       WHERE c.status = 'ringing'
         AND c.caller_id != $1
         AND (
           c.callee_id = $1
           OR (
             c.context = 'space' AND c.callee_id IS NULL
             AND EXISTS (
               SELECT 1 FROM space_members sm
               WHERE sm.space_id = c.space_id AND sm.user_id = $1
             )
           )
         )
         AND c.created_at > $2
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [uid_, now() - 60]
    );

    const sinceId = parseInt(req.query.since || "0", 10) || 0;
    const signals = await query(
      `SELECT id, call_id, from_user, kind, payload, created_at
       FROM call_signals
       WHERE to_user = $1 AND id > $2
       ORDER BY id ASC
       LIMIT 50`,
      [uid_, sinceId]
    );

    const myCalls = await query(
      `SELECT id, status, type, context, private_code, space_id, caller_id, callee_id
       FROM calls
       WHERE (caller_id = $1 OR callee_id = $1)
         AND status IN ('ringing', 'active')
         AND created_at > $2
       ORDER BY created_at DESC
       LIMIT 5`,
      [uid_, now() - 3600]
    );

    res.json({
      incoming: incoming.rows,
      signals: signals.rows,
      myCalls: myCalls.rows,
    });
  } catch (e) {
    console.error("calls/poll", e);
    res.status(500).json({ error: "Erreur poll appels" });
  }
});

app.post("/api/calls/:id/answer", withAuth, async (req, res) => {
  try {
    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    if (call.status !== "ringing") {
      return res.status(400).json({ error: "Appel déjà traité" });
    }

    let allowed = call.callee_id === req.user.id;
    if (!allowed && call.context === "space" && call.space_id) {
      const m = await queryOne(
        "SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2",
        [call.space_id, req.user.id]
      );
      allowed = !!m;
    }
    if (!allowed) return res.status(403).json({ error: "Accès refusé" });

    await query(
      "UPDATE calls SET status = 'active', callee_id = COALESCE(callee_id, $1) WHERE id = $2",
      [req.user.id, call.id]
    );

    res.json({ ok: true, callId: call.id, type: call.type });
  } catch (e) {
    console.error("calls/answer", e);
    res.status(500).json({ error: "Erreur answer" });
  }
});

app.post("/api/calls/:id/reject", withAuth, async (req, res) => {
  try {
    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    await query(
      "UPDATE calls SET status = 'rejected', ended_at = $1 WHERE id = $2",
      [now(), call.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur reject" });
  }
});

app.post("/api/calls/:id/end", withAuth, async (req, res) => {
  try {
    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    await query(
      "UPDATE calls SET status = 'ended', ended_at = $1 WHERE id = $2",
      [now(), call.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur end" });
  }
});

app.post("/api/calls/:id/signal", withAuth, async (req, res) => {
  try {
    const { toUser, kind, payload } = req.body;
    if (!toUser || !kind || !payload) {
      return res.status(400).json({ error: "toUser, kind, payload requis" });
    }
    if (!["offer", "answer", "ice"].includes(kind)) {
      return res.status(400).json({ error: "kind invalide" });
    }

    const call = await queryOne("SELECT * FROM calls WHERE id = $1", [req.params.id]);
    if (!call) return res.status(404).json({ error: "Appel introuvable" });
    if (!["ringing", "active"].includes(call.status)) {
      return res.status(400).json({ error: "Appel terminé" });
    }

    await query(
      `INSERT INTO call_signals (call_id, from_user, to_user, kind, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [call.id, req.user.id, toUser, kind, JSON.stringify(payload), now()]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("calls/signal", e);
    res.status(500).json({ error: "Erreur signal" });
  }
});

// ========== STATIC / FALLBACK ==========
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

app.listen(PORT, () => {
  console.log(`Align API + frontend on :${PORT}`);
});
