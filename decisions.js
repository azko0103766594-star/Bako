/* decisions.js – Decisions / Plans + Infos */

// ========== DECISIONS ==========
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
      '<div class="opt ' + (o.me ? 'voted' : '') + '" data-d="' + di + '" data-o="' + oi + '"><span>' + o.text + '</span><span class="v">' + o.votes + ' vote' + (o.votes > 1 ? 's' : '') + '</span></div>'
    ).join('');
    list.appendChild(card);
  });
  list.querySelectorAll('.opt').forEach(el => {
    el.onclick = () => {
      const d = state.decisions[state.currentSpaceId][el.dataset.d];
      d.options.forEach(o => { if (o.me) { o.votes = Math.max(0, o.votes - 1); o.me = false; } });
      d.options[el.dataset.o].votes++;
      d.options[el.dataset.o].me = true;
      save();
      renderDecisions();
      toast('Vote enregistré');
    };
  });
}

function createDecision() {
  const q = (document.getElementById('decision-question').value || '').trim();
  const raw = (document.getElementById('decision-options').value || '').trim();
  if (!q || !raw) { toast('Remplis tout'); return; }
  const opts = raw.split('\n').map(s => s.trim()).filter(Boolean).map(t => ({ text: t, votes: 0, me: false }));
  if (opts.length < 2) { toast('Min 2 options'); return; }
  if (!state.decisions[state.currentSpaceId]) state.decisions[state.currentSpaceId] = [];
  state.decisions[state.currentSpaceId].push({ id: uid(), q, options: opts });
  save();
  document.getElementById('modal-decision').classList.remove('show');
  renderDecisions();
  toast('Décision lancée !');
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

  // Toujours rafraîchir le membre depuis l'API (id + personal_code)
  if (state.currentSpaceId && typeof api === "function") {
    try {
      const data = await api("/api/spaces/" + state.currentSpaceId);
      if (data && data.members && data.members.length) {
        const found = data.members.find(m =>
          (member.id && m.id === member.id) ||
          (member.username && m.username === member.username) ||
          (member.firstname && m.firstname === member.firstname)
        );
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

  try {
    toast("Ouverture du chat…");
    let data = null;
    let lastErr = null;

    // 1) Code à 6 chiffres → marche même avec l'ancien backend
    if (hasSixCode && typeof startPrivateChatApi === "function") {
      try {
        data = await startPrivateChatApi(pCodeMember);
      } catch (e) {
        lastErr = e;
        console.warn("start by code failed", e);
      }
    }

    // 2) Sinon userId → backend à jour requis
    if (!data && member.id && typeof startPrivateChatByUserApi === "function") {
      try {
        data = await startPrivateChatByUserApi(member.id);
      } catch (e) {
        lastErr = e;
        console.warn("start by userId failed", e);
      }
    }

    if (!data) {
      const msg = (lastErr && lastErr.message) || "";
      if (/introuvable|code/i.test(msg)) {
        toast("Membre sans code valide. Recharge l'espace (Infos) puis réessaie.");
      } else {
        toast(msg || "Impossible d'ouvrir le chat");
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
        otherName: data.otherName || member.firstname || "Ami",
        otherCode: pCode,
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
    }
    if (typeof save === "function") save();
    if (typeof openPrivateChat === "function") openPrivateChat(pCode);
  } catch (err) {
    console.error(err);
    toast(err.message || "Impossible d'ouvrir le chat");
  }
}


