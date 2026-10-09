const state = {
  user: null,
  spaces: [],
  currentSpaceId: null,
  currentThread: 'general',
  messages: {},
  decisions: {}
};

function load() {
  try {
    const s = localStorage.getItem('align_v2');
    if (s) {
      const p = JSON.parse(s);
      state.user = p.user || null;
      state.spaces = Array.isArray(p.spaces) ? p.spaces : [];
      state.messages = p.messages || {};
      state.decisions = p.decisions || {};
    }
  } catch (e) {
    console.error('Load error', e);
    localStorage.removeItem('align_v2');
  }
}

function save() {
  try {
    localStorage.setItem('align_v2', JSON.stringify({
      user: state.user,
      spaces: state.spaces,
      messages: state.messages,
      decisions: state.decisions
    }));
  } catch (e) {
    console.error('Save error', e);
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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function code() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function initial(n) {
  return n ? n.charAt(0).toUpperCase() : '?';
}

function defaultAvatar(name) {
  try {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 80;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(0, 0, 80, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial(name), 40, 44);
    return c.toDataURL();
  } catch (e) {
    return '';
  }
}

function getBaseUrl() {
  return window.location.origin;
}

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
  const btnGmail = document.getElementById('btn-gmail');
  if (btnGmail) {
    btnGmail.onclick = () => {
      state.user = {
        email: 'demo@gmail.com',
        ok: false,
        avatar: null,
        firstname: '',
        username: '',
        bio: ''
      };
      save();
      show('screen-profile');
    };
  }

  const avatarUpload = document.getElementById('avatar-upload');
  if (avatarUpload) {
    avatarUpload.onclick = () => {
      const input = document.getElementById('avatar-input');
      if (input) input.click();
    };
  }

  const avatarInput = document.getElementById('avatar-input');
  if (avatarInput) {
    avatarInput.onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        if (state.user) state.user.avatar = ev.target.result;
        const preview = document.getElementById('avatar-preview');
        if (preview) preview.innerHTML = '<img src="' + ev.target.result + '">';
      };
      r.readAsDataURL(f);
    };
  }

  const bioInput = document.getElementById('input-bio');
  if (bioInput) {
    bioInput.oninput = (e) => {
      const count = document.getElementById('bio-count');
      if (count) count.textContent = e.target.value.length;
    };
  }

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

  const btnSave = document.getElementById('btn-save-profile');
  if (btnSave) {
    btnSave.onclick = () => {
      const fn = (document.getElementById('input-firstname').value || '').trim();
      let un = (document.getElementById('input-username').value || '').trim().replace(/[^a-zA-Z0-9._]/g, '');
      if (!fn || un.length < 3) {
        toast('Prénom et username (min 3) obligatoires');
        return;
      }
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
  }

  const btnCreate = document.getElementById('btn-create-space');
  if (btnCreate) {
    btnCreate.onclick = () => {
      const nameInput = document.getElementById('space-name');
      const descInput = document.getElementById('space-desc');
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      show('screen-create');
    };
  }

  const btnJoin = document.getElementById('btn-join-space');
  if (btnJoin) {
    btnJoin.onclick = () => {
      const codeInput = document.getElementById('join-code');
      if (codeInput) codeInput.value = '';
      show('screen-join');
    };
  }

  const btnPrivate = document.getElementById('btn-private-msg');
  if (btnPrivate) {
    btnPrivate.onclick = () => toast('Bientôt disponible');
  }

  const btnBackCreate = document.getElementById('btn-back-create');
  if (btnBackCreate) btnBackCreate.onclick = () => show('screen-home');

  const btnBackJoin = document.getElementById('btn-back-join');
  if (btnBackJoin) btnBackJoin.onclick = () => show('screen-home');

  const btnBackSpace = document.getElementById('btn-back-space');
  if (btnBackSpace) {
    btnBackSpace.onclick = () => {
      state.currentSpaceId = null;
      renderHome();
      show('screen-home');
    };
  }

  const btnConfirmCreate = document.getElementById('btn-confirm-create');
  if (btnConfirmCreate) {
    btnConfirmCreate.onclick = function () {
      try {
        createSpace();
      } catch (err) {
        console.error('Create space error:', err);
        toast('Erreur lors de la création');
      }
    };
  }

  const btnJoinCode = document.getElementById('btn-join-code');
  if (btnJoinCode) {
    btnJoinCode.onclick = function () {
      try {
        joinSpace();
      } catch (err) {
        console.error('Join error:', err);
        toast('Erreur lors de la connexion');
      }
    };
  }

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

  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      state.currentThread = c.dataset.thread || 'general';
      renderMessages();
    };
  });

  const btnSend = document.getElementById('btn-send-msg');
  if (btnSend) btnSend.onclick = sendMsg;

  const msgInput = document.getElementById('message-input');
  if (msgInput) {
    msgInput.onkeypress = (e) => {
      if (e.key === 'Enter') sendMsg();
    };
  }

  const btnNewDec = document.getElementById('btn-new-decision');
  if (btnNewDec) {
    btnNewDec.onclick = () => {
      const q = document.getElementById('decision-question');
      const o = document.getElementById('decision-options');
      if (q) q.value = '';
      if (o) o.value = '';
      const modal = document.getElementById('modal-decision');
      if (modal) modal.classList.add('show');
    };
  }

  const btnCancelDec = document.getElementById('btn-cancel-decision');
  if (btnCancelDec) {
    btnCancelDec.onclick = () => {
      const modal = document.getElementById('modal-decision');
      if (modal) modal.classList.remove('show');
    };
  }

  const btnConfirmDec = document.getElementById('btn-confirm-decision');
  if (btnConfirmDec) btnConfirmDec.onclick = createDecision;

  const btnCopy = document.getElementById('btn-copy-link');
  if (btnCopy) {
    btnCopy.onclick = () => {
      const i = document.getElementById('invite-link');
      if (i) {
        navigator.clipboard.writeText(i.value)
          .then(() => toast('Lien copié !'))
          .catch(() => toast('Impossible de copier'));
      }
    };
  }
}

function renderHome() {
  if (!state.user) return;

  const av = document.getElementById('home-avatar');
  if (av) {
    av.src = state.user.avatar || defaultAvatar(state.user.firstname || 'U');
  }
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = state.user.firstname || 'Utilisateur';

  const list = document.getElementById('spaces-list');
  const empty = document.getElementById('empty-spaces');
  if (!list || !empty) return;

  list.innerHTML = '';

  if (!state.spaces || state.spaces.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    state.spaces.forEach(sp => {
      const d = document.createElement('div');
      d.className = 'space-card';
      d.innerHTML = '<div class="space-icon">' + initial(sp.name) + '</div>' +
        '<div><h3>' + (sp.name || '') + '</h3><p>' +
        (sp.members ? sp.members.length : 0) + ' membre' +
        ((sp.members && sp.members.length > 1) ? 's' : '') +
        ' · ' + (sp.code || '') + '</p></div>';
      d.onclick = () => openSpace(sp.id);
      list.appendChild(d);
    });
  }
}

function createSpace() {
  if (!state.user || !state.user.ok) {
    toast('Tu dois d\'abord créer ton profil');
    show('screen-profile');
    return;
  }

  const nameInput = document.getElementById('space-name');
  const name = (nameInput ? nameInput.value : '').trim();

  if (!name) {
    toast('Donne un nom à l\'espace');
    return;
  }

  const descInput = document.getElementById('space-desc');
  const description = descInput ? descInput.value.trim() : '';

  const newCode = code();
  const newId = uid();

  const sp = {
    id: newId,
    name: name,
    description: description,
    code: newCode,
    link: getBaseUrl() + '/?code=' + newCode,
    members: [{
      username: state.user.username || 'user',
      firstname: state.user.firstname || 'User',
      avatar: state.user.avatar || null
    }]
  };

  if (!Array.isArray(state.spaces)) state.spaces = [];
  state.spaces.push(sp);

  state.messages[newId] = {
    general: [{
      id: uid(),
      author: 'Align',
      text: 'Bienvenue dans « ' + name + ' » !',
      mine: false
    }],
    organisation: [],
    blabla: []
  };

  state.decisions[newId] = [];

  save();
  toast('Espace créé ! Code : ' + newCode);
  openSpace(newId);
}

function joinSpace() {
  if (!state.user || !state.user.ok) {
    toast('Tu dois d\'abord créer ton profil');
    return;
  }

  const codeInput = document.getElementById('join-code');
  const c = (codeInput ? codeInput.value : '').trim();

  if (c.length !== 6 || !/^\d{6}$/.test(c)) {
    toast('Entre un code à 6 chiffres');
    return;
  }

  const sp = state.spaces.find(s => s.code === c);
  if (!sp) {
    toast('Espace introuvable. Crée-en un d\'abord.');
    return;
  }

  const already = sp.members && sp.members.some(m => m.username === state.user.username);
  if (!already) {
    if (!sp.members) sp.members = [];
    sp.members.push({
      username: state.user.username,
      firstname: state.user.firstname,
      avatar: state.user.avatar
    });
    save();
  }

  toast('Tu as rejoint « ' + sp.name + ' »');
  openSpace(sp.id);
}

function openSpace(id) {
  state.currentSpaceId = id;
  state.currentThread = 'general';

  const sp = state.spaces.find(s => s.id === id);
  if (!sp) {
    toast('Espace introuvable');
    show('screen-home');
    return;
  }

  const titleEl = document.getElementById('space-title');
  if (titleEl) titleEl.textContent = sp.name || 'Espace';

  const countEl = document.getElementById('space-members-count');
  if (countEl) {
    const nb = sp.members ? sp.members.length : 0;
    countEl.textContent = nb + ' membre' + (nb > 1 ? 's' : '');
  }

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tabDisc = document.querySelector('.tab[data-tab="discussion"]');
  if (tabDisc) tabDisc.classList.add('active');

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panelDisc = document.getElementById('tab-discussion');
  if (panelDisc) panelDisc.classList.add('active');

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  const chipGen = document.querySelector('.chip[data-thread="general"]');
  if (chipGen) chipGen.classList.add('active');

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

  if (!state.messages[sid]) {
    state.messages[sid] = { general: [], organisation: [], blabla: [] };
  }
  if (!state.messages[sid][th]) {
    state.messages[sid][th] = [];
  }

  const msgs = state.messages[sid][th];

  if (!msgs.length) {
    area.innerHTML = '<div class="empty"><p>Aucun message.</p></div>';
    return;
  }

  msgs.forEach(m => {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.mine ? 'mine' : 'other');
    d.innerHTML = (m.mine ? '' : '<div class="who">' + (m.author || '') + '</div>') +
      '<div>' + (m.text || '') + '</div>';
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

  state.messages[sid][th].push({
    id: uid(),
    author: state.user.firstname || 'Moi',
    text: text,
    mine: true
  });

  save();
  input.value = '';
  renderMessages();
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
        const w = d.options.reduce((a, b) => (a.votes >= b.votes ? a : b));
        return '<p><strong>' + (d.q || '') + '</strong><br>→ ' + (w.text || '') + '</p>';
      }).join('')
    : '<p>Votes en cours...</p>';

  decs.forEach((d, di) => {
    const card = document.createElement('div');
    card.className = 'decision-card';
    let optsHtml = '';
    if (d.options) {
      optsHtml = d.options.map((o, oi) =>
        '<div class="opt ' + (o.me ? 'voted' : '') + '" data-d="' + di + '" data-o="' + oi + '">' +
        '<span>' + (o.text || '') + '</span>' +
        '<span class="v">' + (o.votes || 0) + ' vote' + ((o.votes || 0) > 1 ? 's' : '') + '</span></div>'
      ).join('');
    }
    card.innerHTML = '<h4>' + (d.q || '') + '</h4>' + optsHtml;
    list.appendChild(card);
  });

  list.querySelectorAll('.opt').forEach(el => {
    el.onclick = () => {
      const d = state.decisions[state.currentSpaceId][el.dataset.d];
      if (!d || !d.options) return;
      d.options.forEach(o => {
        if (o.me) {
          o.votes = Math.max(0, (o.votes || 0) - 1);
          o.me = false;
        }
      });
      const opt = d.options[el.dataset.o];
      if (opt) {
        opt.votes = (opt.votes || 0) + 1;
        opt.me = true;
      }
      save();
      renderDecisions();
      toast('Vote enregistré');
    };
  });
}

function createDecision() {
  const qEl = document.getElementById('decision-question');
  const oEl = document.getElementById('decision-options');
  const q = qEl ? qEl.value.trim() : '';
  const raw = oEl ? oEl.value.trim() : '';

  if (!q || !raw) {
    toast('Remplis tout');
    return;
  }

  const opts = raw.split('\n').map(s => s.trim()).filter(Boolean).map(t => ({
    text: t,
    votes: 0,
    me: false
  }));

  if (opts.length < 2) {
    toast('Min 2 options');
    return;
  }

  if (!state.decisions[state.currentSpaceId]) {
    state.decisions[state.currentSpaceId] = [];
  }

  state.decisions[state.currentSpaceId].push({
    id: uid(),
    q: q,
    options: opts
  });

  save();
  const modal = document.getElementById('modal-decision');
  if (modal) modal.classList.remove('show');
  renderDecisions();
  toast('Décision lancée !');
}

function renderInfos() {
  const sp = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!sp) return;

  const codeEl = document.getElementById('space-code-display');
  if (codeEl) codeEl.textContent = sp.code || '------';

  const linkEl = document.getElementById('invite-link');
  if (linkEl) linkEl.value = sp.link || (getBaseUrl() + '/?code=' + (sp.code || ''));

  const listEl = document.getElementById('members-list');
  if (listEl) {
    listEl.innerHTML = (sp.members || []).map(m =>
      '<li><div class="m-avatar">' + initial(m.firstname) + '</div>' +
      '<span>' + (m.firstname || '') + ' <small style="color:#A1A1AA">@' + (m.username || '') + '</small></span></li>'
    ).join('');
  }
}
