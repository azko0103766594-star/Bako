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
      state.spaces = p.spaces || [];
      state.messages = p.messages || {};
      state.decisions = p.decisions || {};
    }
  } catch(e) { localStorage.removeItem('align_v2'); }
}

function save() {
  localStorage.setItem('align_v2', JSON.stringify({
    user: state.user,
    spaces: state.spaces,
    messages: state.messages,
    decisions: state.decisions
  }));
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function code() { return String(Math.floor(100000 + Math.random() * 900000)); }
function initial(n) { return n ? n.charAt(0).toUpperCase() : '?'; }

function defaultAvatar(name) {
  const c = document.createElement('canvas');
  c.width = 80; c.height = 80;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4F46E5';
  ctx.fillRect(0,0,80,80);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Inter,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial(name), 40, 44);
  return c.toDataURL();
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
  document.getElementById('btn-gmail').onclick = () => {
    state.user = { email: 'demo@gmail.com', ok: false, avatar: null, firstname: '', username: '', bio: '' };
    save();
    show('screen-profile');
  };

  document.getElementById('avatar-upload').onclick = () => document.getElementById('avatar-input').click();
  document.getElementById('avatar-input').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      state.user.avatar = ev.target.result;
      document.getElementById('avatar-preview').innerHTML = `<img src="${ev.target.result}">`;
    };
    r.readAsDataURL(f);
  };

  document.getElementById('input-bio').oninput = e => {
    document.getElementById('bio-count').textContent = e.target.value.length;
  };

  const check = () => {
    const fn = document.getElementById('input-firstname').value.trim();
    const un = document.getElementById('input-username').value.trim();
    document.getElementById('btn-save-profile').disabled = !(fn && un.length >= 3);
  };
  document.getElementById('input-firstname').oninput = check;
  document.getElementById('input-username').oninput = check;

  document.getElementById('btn-save-profile').onclick = () => {
    const fn = document.getElementById('input-firstname').value.trim();
    const un = document.getElementById('input-username').value.trim().replace(/[^a-zA-Z0-9._]/g,'');
    if (!fn || un.length < 3) return;
    state.user.firstname = fn;
    state.user.username = un;
    state.user.bio = document.getElementById('input-bio').value.trim();
    state.user.ok = true;
    if (!state.user.avatar) state.user.avatar = defaultAvatar(fn);
    save();
    renderHome();
    show('screen-home');
    toast('Profil créé !');
  };

  document.getElementById('btn-create-space').onclick = () => {
    document.getElementById('space-name').value = '';
    document.getElementById('space-desc').value = '';
    show('screen-create');
  };
  document.getElementById('btn-join-space').onclick = () => {
    document.getElementById('join-code').value = '';
    show('screen-join');
  };
  document.getElementById('btn-private-msg').onclick = () => toast('Bientôt disponible');

  document.getElementById('btn-back-create').onclick = () => show('screen-home');
  document.getElementById('btn-back-join').onclick = () => show('screen-home');
  document.getElementById('btn-back-space').onclick = () => {
    state.currentSpaceId = null;
    renderHome();
    show('screen-home');
  };

  document.getElementById('btn-confirm-create').onclick = createSpace;
  document.getElementById('btn-join-code').onclick = joinSpace;

  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + t.dataset.tab).classList.add('active');
      if (t.dataset.tab === 'plans') renderDecisions();
      if (t.dataset.tab === 'infos') renderInfos();
    };
  });

  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      state.currentThread = c.dataset.thread;
      renderMessages();
    };
  });

  document.getElementById('btn-send-msg').onclick = sendMsg;
  document.getElementById('message-input').onkeypress = e => { if (e.key === 'Enter') sendMsg(); };

  document.getElementById('btn-new-decision').onclick = () => {
    document.getElementById('decision-question').value = '';
    document.getElementById('decision-options').value = '';
    document.getElementById('modal-decision').classList.add('show');
  };
  document.getElementById('btn-cancel-decision').onclick = () => {
    document.getElementById('modal-decision').classList.remove('show');
  };
  document.getElementById('btn-confirm-decision').onclick = createDecision;

  document.getElementById('btn-copy-link').onclick = () => {
    const i = document.getElementById('invite-link');
    navigator.clipboard.writeText(i.value).then(() => toast('Lien copié !'));
  };
}

function renderHome() {
  const av = document.getElementById('home-avatar');
  av.src = state.user.avatar || defaultAvatar(state.user.firstname);
  document.getElementById('home-name').textContent = state.user.firstname;

  const list = document.getElementById('spaces-list');
  const empty = document.getElementById('empty-spaces');
  list.innerHTML = '';

  if (!state.spaces.length) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    state.spaces.forEach(sp => {
      const d = document.createElement('div');
      d.className = 'space-card';
      d.innerHTML = `<div class="space-icon">${initial(sp.name)}</div>
        <div><h3>${sp.name}</h3><p>${sp.members.length} membre${sp.members.length>1?'s':''} · ${sp.code}</p></div>`;
      d.onclick = () => openSpace(sp.id);
      list.appendChild(d);
    });
  }
}

function createSpace() {
  try {
    console.log("1. Début de création");

    const name = document.getElementById('space-name').value.trim();
    const description = document.getElementById('space-desc').value.trim();

    if (!name) {
      toast("Entre le nom de l'espace.");
      return;
    }

    if (!state.user || !state.user.ok) {
      toast("Erreur : profil utilisateur absent.");
      return;
    }

    const sp = {
      id: uid(),
      name: name,
      description: description,
      code: code(),
      link: window.location.origin + window.location.pathname,
      members: [{
        username: state.user.username,
        firstname: state.user.firstname,
        avatar: state.user.avatar
      }]
    };

    state.spaces.push(sp);

    state.messages[sp.id] = {
      general: [{
        id: uid(),
        author: 'Align',
        text: 'Bienvenue dans « ' + name + ' » !',
        mine: false
      }],
      organisation: [],
      blabla: []
    };

    state.decisions[sp.id] = [];

    localStorage.setItem('align_v2', JSON.stringify({
      user: state.user,
      spaces: state.spaces,
      messages: state.messages,
      decisions: state.decisions
    }));

    console.log("2. Espace sauvegardé");

    renderHome();
    openSpace(sp.id);

    toast("Espace créé avec succès !");
  } catch (error) {
    console.error("ERREUR CRÉATION ESPACE :", error);
    toast("Erreur : " + error.message);
  }
      }
function openSpace(id) {
  state.currentSpaceId = id;
  state.currentThread = 'general';
  const sp = state.spaces.find(s => s.id === id);
  if (!sp) return;

  document.getElementById('space-title').textContent = sp.name;
  document.getElementById('space-members-count').textContent = sp.members.length + ' membre' + (sp.members.length > 1 ? 's' : '');

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
  area.innerHTML = '';
  const sid = state.currentSpaceId;
  const th = state.currentThread;
  if (!state.messages[sid]) state.messages[sid] = { general: [], organisation: [], blabla: [] };
  if (!state.messages[sid][th]) state.messages[sid][th] = [];
  const msgs = state.messages[sid][th];

  if (!msgs.length) {
    area.innerHTML = '<div class="empty"><p>Aucun message.</p></div>';
    return;
  }
  msgs.forEach(m => {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.mine ? 'mine' : 'other');
    d.innerHTML = (m.mine ? '' : '<div class="who">' + m.author + '</div>') + '<div>' + m.text + '</div>';
    area.appendChild(d);
  });
  area.scrollTop = area.scrollHeight;
}

function sendMsg() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !state.currentSpaceId) return;
  const sid = state.currentSpaceId;
  const th = state.currentThread;
  if (!state.messages[sid]) state.messages[sid] = { general: [], organisation: [], blabla: [] };
  if (!state.messages[sid][th]) state.messages[sid][th] = [];
  state.messages[sid][th].push({ id: uid(), author: state.user.firstname, text, mine: true });
  save();
  input.value = '';
  renderMessages();
}

function renderDecisions() {
  const list = document.getElementById('decisions-list');
  const cal = document.getElementById('calendar-view');
  list.innerHTML = '';
  const decs = state.decisions[state.currentSpaceId] || [];

  if (!decs.length) {
    cal.innerHTML = '<p>Aucune décision.<br>Lance-en une !</p>';
    return;
  }
  const voted = decs.filter(d => d.options.some(o => o.votes > 0));
  cal.innerHTML = voted.length
    ? voted.map(d => {
        const w = d.options.reduce((a,b) => a.votes >= b.votes ? a : b);
        return '<p><strong>' + d.q + '</strong><br>→ ' + w.text + '</p>';
      }).join('')
    : '<p>Votes en cours...</p>';

  decs.forEach((d, di) => {
    const card = document.createElement('div');
    card.className = 'decision-card';
    card.innerHTML = '<h4>' + d.q + '</h4>' + d.options.map((o, oi) =>
      '<div class="opt ' + (o.me ? 'voted' : '') + '" data-d="' + di + '" data-o="' + oi + '"><span>' + o.text + '</span><span class="v">' + o.votes + ' vote' + (o.votes>1?'s':'') + '</span></div>'
    ).join('');
    list.appendChild(card);
  });

  list.querySelectorAll('.opt').forEach(el => {
    el.onclick = () => {
      const d = state.decisions[state.currentSpaceId][el.dataset.d];
      d.options.forEach(o => { if (o.me) { o.votes = Math.max(0, o.votes-1); o.me = false; } });
      d.options[el.dataset.o].votes++;
      d.options[el.dataset.o].me = true;
      save();
      renderDecisions();
      toast('Vote enregistré');
    };
  });
}

function createDecision() {
  const q = document.getElementById('decision-question').value.trim();
  const raw = document.getElementById('decision-options').value.trim();
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
  document.getElementById('space-code-display').textContent = sp.code;
  document.getElementById('invite-link').value = sp.link;
  document.getElementById('members-list').innerHTML = sp.members.map(m =>
    '<li><div class="m-avatar">' + initial(m.firstname) + '</div><span>' + m.firstname + ' <small style="color:#A1A1AA">@' + m.username + '</small></span></li>'
  ).join('');
}
