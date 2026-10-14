/* decisions.js – Decisions / Plans + Infos */

// ========== DECISIONS (API + local) ==========

/** Charge les décisions depuis le serveur pour l'espace courant */
async function loadDecisions(spaceId) {
  const sid = spaceId || state.currentSpaceId;
  if (!sid || typeof getDecisionsApi !== "function") return;
  try {
    const data = await getDecisionsApi(sid);
    const list = (data.decisions || []).map(d => ({
      id: d.id,
      q: d.question || d.q || "",
      options: (d.options || []).map(o => ({
        id: o.id,
        text: o.text,
        votes: o.votes || 0,
        me: d.myOptionId ? String(o.id) === String(d.myOptionId) : !!o.me
      }))
    }));
    state.decisions[sid] = list;
    if (typeof save === "function") save();
    if (sid === state.currentSpaceId) renderDecisions();
  } catch (e) {
    console.warn("loadDecisions", e);
  }
}

function renderDecisions() {
  const list = document.getElementById('decisions-list');
  const cal = document.getElementById('calendar-view');
  if (!list || !cal) return;
  list.innerHTML = '';
  const decs = state.decisions[state.currentSpaceId] || [];
  if (!decs.length) {
    cal.innerHTML = '<p>Aucune décision.<br>Lance-en une !</p>';
    return;
  }
  const voted = decs.filter(d => d.options && d.options.some(o => o.votes > 0));
  cal.innerHTML = voted.length
    ? voted.map(d => {
        const w = d.options.reduce((a, b) => a.votes >= b.votes ? a : b);
        return '<p><strong>' + d.q + '</strong><br>→ ' + w.text + '</p>';
      }).join('')
    : '<p>Votes en cours...</p>';

  decs.forEach((d, di) => {
    const card = document.createElement('div');
    card.className = 'decision-card';
    card.innerHTML = '<h4>' + d.q + '</h4>' + d.options.map((o, oi) =>
      '<div class="opt ' + (o.me ? 'voted' : '') + '" data-d="' + di + '" data-o="' + oi + '" data-oid="' + (o.id || '') + '"><span>' + o.text + '</span><span class="v">' + (o.votes || 0) + ' vote' + ((o.votes || 0) > 1 ? 's' : '') + '</span></div>'
    ).join('');
    list.appendChild(card);
  });

  list.querySelectorAll('.opt').forEach(el => {
    el.onclick = async () => {
      const di = parseInt(el.dataset.d, 10);
      const oi = parseInt(el.dataset.o, 10);
      const d = state.decisions[state.currentSpaceId][di];
      if (!d) return;
      const option = d.options[oi];
      if (!option) return;

      // Optimistic UI
      d.options.forEach(o => { if (o.me) { o.votes = Math.max(0, (o.votes || 0) - 1); o.me = false; } });
      option.votes = (option.votes || 0) + 1;
      option.me = true;
      renderDecisions();

      // Envoi serveur
      if (d.id && option.id && typeof voteDecisionApi === "function") {
        try {
          const res = await voteDecisionApi(d.id, option.id);
          if (res && res.options) {
            d.options = res.options.map(o => ({
              id: o.id,
              text: o.text,
              votes: o.votes || 0,
              me: res.myOptionId ? String(o.id) === String(res.myOptionId) : false
            }));
            if (typeof save === "function") save();
            renderDecisions();
          }
          toast('Vote enregistré');
        } catch (e) {
          console.error(e);
          toast(e.message || 'Vote non enregistré');
          // Recharger depuis le serveur pour corriger
          loadDecisions(state.currentSpaceId);
        }
      } else {
        // Pas d'id serveur → local seulement
        if (typeof save === "function") save();
        toast('Vote enregistré (local)');
      }
    };
  });
}

async function createDecision() {
  const q = (document.getElementById('decision-question').value || '').trim();
  const raw = (document.getElementById('decision-options').value || '').trim();
  if (!q || !raw) { toast('Remplis tout'); return; }
  const optTexts = raw.split('\n').map(s => s.trim()).filter(Boolean);
  if (optTexts.length < 2) { toast('Min 2 options'); return; }

  const spaceId = state.currentSpaceId;
  if (!spaceId) { toast('Aucun espace ouvert'); return; }

  document.getElementById('modal-decision').classList.remove('show');
  toast('Création…');

  // API d'abord
  if (typeof createDecisionApi === "function") {
    try {
      const data = await createDecisionApi(spaceId, q, optTexts);
      if (!state.decisions[spaceId]) state.decisions[spaceId] = [];
      state.decisions[spaceId].unshift({
        id: data.id,
        q: data.question || q,
        options: (data.options || optTexts.map(t => ({ text: t, votes: 0 }))).map(o => ({
          id: o.id,
          text: o.text || o,
          votes: o.votes || 0,
          me: false
        }))
      });
      if (typeof save === "function") save();
      renderDecisions();
      toast('Décision lancée !');
      // Recharge pour être sûr
      loadDecisions(spaceId);
      return;
    } catch (e) {
      console.error(e);
      toast(e.message || 'Erreur création décision');
      // fallback local
    }
  }

  // Fallback local si API KO
  if (!state.decisions[spaceId]) state.decisions[spaceId] = [];
  state.decisions[spaceId].push({
    id: (typeof uid === "function" ? uid() : String(Date.now())),
    q,
    options: optTexts.map(t => ({ text: t, votes: 0, me: false }))
  });
  if (typeof save === "function") save();
  renderDecisions();
  toast('Décision lancée (local)');
}

function renderInfos() {
  const sp = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!sp) return;
  document.getElementById('space-code-display').textContent = sp.code || '------';
  document.getElementById('invite-link').value = sp.link || (getBaseUrl() + '/?code=' + sp.code);
  const list = document.getElementById('members-list');
  list.innerHTML = '';
  (sp.members || []).forEach(m => {
    const li = document.createElement('li');
    li.className = 'member-row';
    const isMe = state.user && (
      m.username === state.user.username ||
      m.id === state.user.id ||
      m.firstname === state.user.firstname
    );
    const av = m.avatar
      ? '<img src="' + m.avatar + '" alt="">'
      : initial(m.firstname || m.username || '?');
    li.innerHTML =
      '<div class="m-avatar">' + av + '</div>' +
      '<span class="member-name">' + (m.firstname || m.username || 'Membre') +
      ' <small style="color:#A1A1AA">@' + (m.username || '') + '</small></span>' +
      (isMe ? '<small class="member-you">toi</small>' : '<small class="member-msg-hint">💬 Message</small>');
    if (!isMe) {
      li.style.cursor = 'pointer';
      li.onclick = () => openPrivateFromMember(m);
    }
    list.appendChild(li);
  });
}

/** Ouvre un chat privé avec un membre d'espace (sans saisir son code) */
async function openPrivateFromMember(member) {
  if (!member) return;
  if (!state.user || !state.user.ok) {
    toast("Connecte-toi d'abord");
    return;
  }

  // Ne pas ouvrir un chat avec soi-même
  if (state.user.id && member.id && String(member.id) === String(state.user.id)) {
    toast("C'est toi !");
    return;
  }

  // Toujours rafraîchir le membre depuis l'API (id + personal_code)
  if (state.currentSpaceId && typeof api === "function") {
    try {
      const data = await api("/api/spaces/" + state.currentSpaceId);
      if (data && data.members && data.members.length) {
        const mid = member.id ? String(member.id) : "";
        const mUser = (member.username || "").toLowerCase();
        const mFirst = (member.firstname || "").toLowerCase();
        const found = data.members.find(m => {
          if (mid && String(m.id) === mid) return true;
          if (mUser && (m.username || "").toLowerCase() === mUser) return true;
          if (mFirst && (m.firstname || "").toLowerCase() === mFirst) return true;
          return false;
        });
        if (found) {
          member = {
            id: found.id,
            firstname: found.firstname,
            username: found.username,
            avatar: found.avatar_url || found.avatar,
            personal_code: found.personal_code,
            personalCode: found.personal_code
          };
        }
        // maj liste locale
        const sp = state.spaces.find(s => s.id === state.currentSpaceId);
        if (sp) {
          sp.members = data.members.map(m => ({
            id: m.id,
            firstname: m.firstname,
            username: m.username,
            avatar: m.avatar_url || m.avatar,
            personal_code: m.personal_code,
            personalCode: m.personal_code
          }));
          if (typeof save === "function") save();
        }
      }
    } catch (e) {
      console.warn("refresh members", e);
    }
  }

  const pCodeMember = (member.personal_code || member.personalCode || "").toString().trim();
  const hasSixCode = /^\d{6}$/.test(pCodeMember);
  const userId = member.id ? String(member.id).trim() : "";

  if (!userId && !hasSixCode) {
    toast("Membre incomplet. Va dans Infos, attends le chargement, puis réessaie.");
    return;
  }

  try {
    toast("Ouverture du chat…");
    let data = null;
    let lastErr = null;

    // 1) Priorité userId (pas besoin du code personnel)
    if (userId && typeof startPrivateChatByUserApi === "function") {
      try {
        data = await startPrivateChatByUserApi(userId);
      } catch (e) {
        lastErr = e;
        console.warn("start by userId failed", e);
      }
    }

    // 2) Fallback code à 6 chiffres
    if (!data && hasSixCode && typeof startPrivateChatApi === "function") {
      try {
        data = await startPrivateChatApi(pCodeMember);
      } catch (e) {
        lastErr = e;
        console.warn("start by code failed", e);
      }
    }

    // 3) Dernier recours : route dédiée start-user
    if (!data && userId && typeof api === "function") {
      try {
        data = await api("/api/private/start-user", {
          method: "POST",
          body: JSON.stringify({ userId })
        });
      } catch (e) {
        lastErr = e;
        console.warn("start-user failed", e);
      }
    }

    if (!data) {
      const msg = (lastErr && lastErr.message) || "";
      if (/introuvable/i.test(msg)) {
        toast("Utilisateur introuvable. Recharge l'espace (onglet Infos) puis réessaie.");
      } else if (/code/i.test(msg)) {
        toast("Code invalide. Recharge l'espace (Infos) puis réessaie.");
      } else {
        toast(msg || "Impossible d'ouvrir le chat privé");
      }
      return;
    }

    const pCode = (data.code || pCodeMember || "").toString();
    if (!pCode) {
      toast("Code de chat manquant");
      return;
    }

    if (!state.privateChats[pCode]) {
      state.privateChats[pCode] = {
        otherName: data.otherName || member.firstname || member.username || "Ami",
        otherCode: pCodeMember || pCode,
        otherId: data.otherId || userId || null,
        otherAvatar: data.otherAvatar || member.avatar || null,
        messages: [],
        unread: 0,
        online: false,
        pinned: false,
        archived: false,
        updatedAt: Date.now()
      };
    } else {
      state.privateChats[pCode].otherName = data.otherName || state.privateChats[pCode].otherName;
      state.privateChats[pCode].otherAvatar = data.otherAvatar || state.privateChats[pCode].otherAvatar;
      if (data.otherId) state.privateChats[pCode].otherId = data.otherId;
      if (pCodeMember) state.privateChats[pCode].otherCode = pCodeMember;
    }
    if (typeof save === "function") save();
    if (typeof openPrivateChat === "function") openPrivateChat(pCode);
  } catch (err) {
    console.error(err);
    toast(err.message || "Impossible d'ouvrir le chat");
  }
}


