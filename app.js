const state = {
  user: null,
  spaces: [],
  currentSpaceId: null,
  currentThread: 'general',
  messages: {},
  decisions: {},
  privateChats: {},      // key = otherUsername → { messages: [], otherName: '' }
  currentPrivateUser: null
};

function load() {
  try {
    const s = localStorage.getItem('align_v3');
    if (s) {
      const p = JSON.parse(s);
      state.user = p.user || null;
      state.spaces = Array.isArray(p.spaces) ? p.spaces : [];
      state.messages = p.messages || {};
      state.decisions = p.decisions || {};
      state.privateChats = p.privateChats || {};
    }
  } catch (e) {
    localStorage.removeItem('align_v3');
  }
}

function save() {
  try {
    localStorage.setItem('align_v3', JSON.stringify({
      user: state.user,
      spaces: state.spaces,
      messages: state.messages,
      decisions: state.decisions,
      privateChats: state.privateChats
    }));
  } catch (e) {
    toast('Erreur de sauvegarde');
  }
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function code() { return String(Math.floor(100000 + Math.random() * 900000)); }
function initial(n) { return n ? n.charAt(0).toUpperCase() : '?'; }

function defaultAvatar(name) {
  try {
    const c = document.createElement('canvas');
    c.width = 80; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(0, 0, 80, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial(name), 40, 44);
    return c.toDataURL();
  } catch (e) { return ''; }
}

function getBaseUrl() { return window.location.origin; }

document.addEventListener('DOMContentLoaded', () => {
  load();
  if (state.user && state.user.ok) {
    renderHome();
    show('screen-home');
  } else if (state.user) {
    show('screen-profile');
  } else {
    show('screen-login');
  }
  bind();
});

function bind() {
  // Login
  const btnGmail = document.getElementById('btn-gmail');
  if (btnGmail) btnGmail.onclick = () => {
    state.user = { email: 'demo@gmail.com', ok: false, avatar: null, firstname: '', username: '', bio: '' };
    save();
    show('screen-profile');
  };

  // Avatar
  const avatarUpload = document.getElementById('avatar-upload');
  if (avatarUpload) avatarUpload.onclick = () => document.getElementById('avatar-input').click();
  const avatarInput = document.getElementById('avatar-input');
  if (avatarInput) avatarInput.onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      if (state.user) state.user.avatar = ev.target.result;
      const preview = document.getElementById('avatar-preview');
      if (preview) preview.innerHTML = '<img src="' + ev.target.result + '">';
    };
    r.readAsDataURL(f);
  };

  // Bio count
  const bioInput = document.getElementById('input-bio');
  if (bioInput) bioInput.oninput = e => {
    const c = document.getElementById('bio-count');
    if (c) c.textContent = e.target.value.length;
  };

  // Profile form check
  const check = () => {
    const fn = (document.getElementById('input-firstname') || {}).value || '';
    const un = (document.getElementById('input-username') || {}).value || '';
    const btn = document.getElementById('btn-save-profile');
    if (btn) btn.disabled = !(fn.trim() && un.trim().length >= 3);
  };
  const fnInput = document.getElementById('input-firstname');
  const unInput = document.getElementById('input-username');
  if (fnInput) fnInput.oninput = check;
  if (unInput) unInput.oninput = check;

  // Save profile
  const btnSave = document.getElementById('btn-save-profile');
  if (btnSave) btnSave.onclick = () => {
    const fn = (document.getElementById('input-firstname').value || '').trim();
    let un = (document.getElementById('input-username').value || '').trim().replace(/[^a-zA-Z0-9._]/g, '');
    if (!fn || un.length < 3) { toast('Prénom et username (min 3) obligatoires'); return; }
    if (!state.user) state.user = {};
    state.user.firstname = fn;
    state.user.username = un;
    state.user.bio = (document.getElementById('input-bio').value || '').trim();
    state.user.ok = true;
    if (!state.user.avatar) state.user.avatar = defaultAvatar(fn);
    save();
    renderHome();
    show('screen-home');
    toast('Profil créé !');
  };

  // Home nav
  const btnCreate = document.getElementById('btn-create-space');
  if (btnCreate) btnCreate.onclick = () => {
    document.getElementById('space-name').value = '';
    document.getElementById('space-desc').value = '';
    show('screen-create');
  };

  const btnJoin = document.getElementById('btn-join-space');
  if (btnJoin) btnJoin.onclick = () => {
    document.getElementById('join-code').value = '';
    show('screen-join');
  };

  const btnPrivate = document.getElementById('btn-private-msg');
  if (btnPrivate) btnPrivate.onclick = () => {
    renderPrivateList();
    show('screen-messages');
  };

  // Back buttons
  document.getElementById('btn-back-create').onclick = () => show('screen-home');
  document.getElementById('btn-back-join').onclick = () => show('screen-home');
  document.getElementById('btn-back-space').onclick = () => {
    state.currentSpaceId = null;
    renderHome();
    show('screen-home');
  };
  document.getElementById('btn-back-messages').onclick = () => show('screen-home');
  document.getElementById('btn-back-private-chat').onclick = () => {
    state.currentPrivateUser = null;
    renderPrivateList();
    show('screen-messages');
  };

  // Create / Join space
  document.getElementById('btn-confirm-create').onclick = () => { try { createSpace(); } catch(e) { toast('Erreur création'); } };
  document.getElementById('btn-join-code').onclick = () => { try { joinSpace(); } catch(e) { toast('Erreur'); } };

  // Start private chat
  document.getElementById('btn-start-chat').onclick = startPrivateChat;

  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('tab-' + t.dataset.tab);
      if (panel) panel.classList.add('active');
      if (t.dataset.tab === 'plans') renderDecisions();
      if (t.dataset.tab === 'infos') renderInfos();
    };
  });

  // Threads
  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      state.currentThread = c.dataset.thread || 'general';
      renderMessages();
    };
  });

  // Send messages
  document.getElementById('btn-send-msg').onclick = sendMsg;
  document.getElementById('message-input').onkeypress = e => { if (e.key === 'Enter') sendMsg(); };

  document.getElementById('btn-send-private').onclick = sendPrivateMsg;
  document.getElementById('private-message-input').onkeypress = e => { if (e.key === 'Enter') sendPrivateMsg(); };

  // Decisions
  document.getElementById('btn-new-decision').onclick = () => {
    document.getElementById('decision-question').value = '';
    document.getElementById('decision-options').value = '';
    document.getElementById('modal-decision').classList.add('show');
  };
  document.getElementById('btn-cancel-decision').onclick = () => {
    document.getElementById('modal-decision').classList.remove('show');
  };
  document.getElementById('btn-confirm-decision').onclick = createDecision;

  // Copy link
  document.getElementById('btn-copy-link').onclick = () => {
    const i = document.getElementById('invite-link');
    if (i) navigator.clipboard.writeText(i.value).then(() => toast('Lien copié !'));
  };
}

// ========== HOME ==========
function renderHome() {
  if (!state.user) return;
  const av = document.getElementById('home-avatar');
  if (av) av.src = state.user.avatar || defaultAvatar(state.user.firstname || 'U');
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = state.user.firstname || 'Utilisateur';

  const list = document.getElementById('spaces-list');
  const empty = document.getElementById('empty-spaces');
  if (!list || !empty) return;
  list.innerHTML = '';

  if (!state.spaces.length) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    state.spaces.forEach(sp => {
      const d = document.createElement('div');
      d.className = 'space-card';
      d.innerHTML = '<div class="space-icon">' + initial(sp.name) + '</div><div><h3>' + sp.name + '</h3><p>' +
        (sp.members ? sp.members.length : 0) + ' membre' + ((sp.members && sp.members.length > 1) ? 's' : '') +
        ' · ' + (sp.code || '') + '</p></div>';
      d.onclick = () => openSpace(sp.id);
      list.appendChild(d);
    });
  }
}

// ========== SPACES ==========
function createSpace() {
  if (!state.user || !state.user.ok) { toast('Crée ton profil d\'abord'); return; }
  const name = (document.getElementById('space-name').value || '').trim();
  if (!name) { toast('Donne un nom'); return; }

  const newCode = code();
  const newId = uid();
  const sp = {
    id: newId,
    name,
    description: (document.getElementById('space-desc').value || '').trim(),
    code: newCode,
    link: getBaseUrl() + '/?code=' + newCode,
    members: [{ username: state.user.username, firstname: state.user.firstname, avatar: state.user.avatar }]
  };
  state.spaces.push(sp);
  state.messages[newId] = {
    general: [{ id: uid(), author: 'Align', text: 'Bienvenue dans « ' + name + ' » !', mine: false }],
    organisation: [],
    blabla: []
  };
  state.decisions[newId] = [];
  save();
  toast('Espace créé ! Code : ' + newCode);
  openSpace(newId);
}

function joinSpace() {
  if (!state.user || !state.user.ok) { toast('Crée ton profil d\'abord'); return; }
  const c = (document.getElementById('join-code').value || '').trim();
  if (c.length !== 6) { toast('Code à 6 chiffres'); return; }
  const sp = state.spaces.find(s => s.code === c);
  if (!sp) { toast('Espace introuvable'); return; }
  if (!sp.members.some(m => m.username === state.user.username)) {
    sp.members.push({ username: state.user.username, firstname: state.user.firstname, avatar: state.user.avatar });
    save();
  }
  toast('Tu as rejoint « ' + sp.name + ' »');
  openSpace(sp.id);
}

function openSpace(id) {
  state.currentSpaceId = id;
  state.currentThread = 'general';
  const sp = state.spaces.find(s => s.id === id);
  if (!sp) { toast('Espace introuvable'); return; }

  document.getElementById('space-title').textContent = sp.name;
  document.getElementById('space-members-count').textContent = (sp.members ? sp.members.length : 0) + ' membre' + ((sp.members && sp.members.length > 1) ? 's' : '');

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab[data-tab="discussion"]').classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-discussion').classList.add('active');
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip[data-thread="general"]').classList.add('active');

  renderMessages();
  renderDecisions();
  renderInfos();
  show('screen-space');
}

function renderMessages() {
  const area = document.getElementById('messages-area');
  if (!area) return;
  area.innerHTML = '';
  const sid = state.currentSpaceId;
  const th = state.currentThread || 'general';
  if (!state.messages[sid]) state.messages[sid] = { general: [], organisation: [], blabla: [] };
  if (!state.messages[sid][th]) state.messages[sid][th] = [];
  const msgs = state.messages[sid][th];
  if (!msgs.length) { area.innerHTML = '<div class="empty"><p>Aucun message.</p></div>'; return; }
  msgs.forEach(m => {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.mine ? 'mine' : 'other');
    d.innerHTML = (m.mine ? '' : '<div class="who">' + (m.author || '') + '</div>') + '<div>' + (m.text || '') + '</div>';
    area.appendChild(d);
  });
  area.scrollTop = area.scrollHeight;
}

function sendMsg() {
  const input = document.getElementById('message-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !state.currentSpaceId) return;
  const sid = state.currentSpaceId;
  const th = state.currentThread || 'general';
  if (!state.messages[sid]) state.messages[sid] = { general: [], organisation: [], blabla: [] };
  if (!state.messages[sid][th]) state.messages[sid][th] = [];
  state.messages[sid][th].push({ id: uid(), author: state.user.firstname, text, mine: true });
  save();
  input.value = '';
  renderMessages();
}

// ========== PRIVATE CHAT ==========
function renderPrivateList() {
  const list = document.getElementById('private-list');
  const empty = document.getElementById('empty-private');
  if (!list || !empty) return;
  list.innerHTML = '';

  const keys = Object.keys(state.privateChats || {});
  if (!keys.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  keys.forEach(username => {
    const chat = state.privateChats[username];
    const last = chat.messages && chat.messages.length ? chat.messages[chat.messages.length - 1].text : 'Aucun message';
    const d = document.createElement('div');
    d.className = 'private-card';
    d.innerHTML = '<div class="space-icon">' + initial(chat.otherName || username) + '</div>' +
      '<div class="info"><h3>' + (chat.otherName || username) + '</h3><p>@' + username + ' · ' + last.substring(0, 30) + '</p></div>';
    d.onclick = () => openPrivateChat(username);
    list.appendChild(d);
  });
}

function startPrivateChat() {
  const input = document.getElementById('search-user');
  let username = (input.value || '').trim().replace(/^@/, '');
  if (!username || username.length < 2) {
    toast('Entre un @username');
    return;
  }
  if (username === state.user.username) {
    toast('Tu ne peux pas te parler à toi-même');
    return;
  }

  // For demo: we accept any username (in real app we would check if user exists)
  if (!state.privateChats[username]) {
    state.privateChats[username] = {
      otherName: username,
      messages: []
    };
    save();
  }
  input.value = '';
  openPrivateChat(username);
}

function openPrivateChat(username) {
  state.currentPrivateUser = username;
  if (!state.privateChats[username]) {
    state.privateChats[username] = { otherName: username, messages: [] };
  }
  document.getElementById('private-chat-name').textContent = state.privateChats[username].otherName || username;
  document.getElementById('private-chat-user').textContent = '@' + username;
  renderPrivateMessages();
  show('screen-private-chat');
}

function renderPrivateMessages() {
  const area = document.getElementById('private-messages-area');
  if (!area) return;
  area.innerHTML = '';
  const chat = state.privateChats[state.currentPrivateUser];
  if (!chat || !chat.messages.length) {
    area.innerHTML = '<div class="empty"><p>Aucun message.<br>Dis bonjour !</p></div>';
    return;
  }
  chat.messages.forEach(m => {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.mine ? 'mine' : 'other');
    d.innerHTML = (m.mine ? '' : '<div class="who">' + (m.author || '') + '</div>') + '<div>' + m.text + '</div>';
    area.appendChild(d);
  });
  area.scrollTop = area.scrollHeight;
}

function sendPrivateMsg() {
  const input = document.getElementById('private-message-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !state.currentPrivateUser) return;

  if (!state.privateChats[state.currentPrivateUser]) {
    state.privateChats[state.currentPrivateUser] = { otherName: state.currentPrivateUser, messages: [] };
  }
  state.privateChats[state.currentPrivateUser].messages.push({
    id: uid(),
    author: state.user.firstname,
    text,
    mine: true,
    time: Date.now()
  });
  save();
  input.value = '';
  renderPrivateMessages();
}

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
  document.getElementById('members-list').innerHTML = (sp.members || []).map(m =>
    '<li><div class="m-avatar">' + initial(m.firstname) + '</div><span>' + m.firstname + ' <small style="color:#A1A1AA">@' + m.username + '</small></span></li>'
  ).join('');
}
