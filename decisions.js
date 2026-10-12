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
  // Recharger les infos membre si id manquant
  if (!member.id && state.currentSpaceId && typeof api === 'function') {
    try {
      const data = await api('/api/spaces/' + state.currentSpaceId);
      if (data && data.members) {
        const found = data.members.find(m =>
          m.username === member.username || m.firstname === member.firstname
        );
        if (found) {
          member = {
            id: found.id,
            firstname: found.firstname,
            username: found.username,
            avatar: found.avatar_url || found.avatar,
            personal_code: found.personal_code
          };
        }
      }
    } catch (e) {}
  }
  try {
    toast("Ouverture du chat…");
    let data = null;
    let lastErr = null;
    if (member.id && typeof startPrivateChatByUserApi === 'function') {
      try {
        data = await startPrivateChatByUserApi(member.id);
      } catch (e) {
        lastErr = e;
        console.warn('start-user failed', e);
      }
    }
    if (!data && (member.personal_code || member.personalCode) && typeof startPrivateChatApi === 'function') {
      try {
        data = await startPrivateChatApi(member.personal_code || member.personalCode);
      } catch (e) {
        lastErr = e;
      }
    }
    if (!data) {
      toast((lastErr && lastErr.message) || "Erreur serveur — impossible d'ouvrir le chat");
      return;
    }
    const pCode = data.code || member.personal_code || member.personalCode;
    if (!pCode) {
      toast("Code de chat manquant");
      return;
    }
    if (!state.privateChats[pCode]) {
      state.privateChats[pCode] = {
        otherName: data.otherName || member.firstname || 'Ami',
        otherCode: pCode,
        otherAvatar: data.otherAvatar || member.avatar || member.avatar_url || null,
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
    if (typeof save === 'function') save();
    if (typeof openPrivateChat === 'function') openPrivateChat(pCode);
  } catch (err) {
    console.error(err);
    toast(err.message || "Impossible d'ouvrir le chat");
  }
}

