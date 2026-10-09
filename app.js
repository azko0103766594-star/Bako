const state = {
  user: null,
  spaces: [],
  currentSpaceId: null,
  currentThread: 'general',
  messages: {},
  decisions: {}
};

// ==============================
// CHARGEMENT ET SAUVEGARDE
// ==============================

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
    console.error('Erreur de chargement :', e);
    state.user = null;
    state.spaces = [];
    state.messages = {};
    state.decisions = {};
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

    return true;
  } catch (e) {
    console.error('Erreur de sauvegarde :', e);
    toast('Erreur de sauvegarde des données.');
    return false;
  }
}

// ==============================
// OUTILS
// ==============================

function show(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });

  const el = document.getElementById(id);

  if (el) {
    el.classList.add('active');
  }
}

function toast(msg) {
  const t = document.getElementById('toast');

  if (!t) {
    console.log(msg);
    return;
  }

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => {
    t.classList.remove('show');
  }, 2500);
}

function uid() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6);
}

function code() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function initial(n) {
  return n ? n.charAt(0).toUpperCase() : '?';
}

function defaultAvatar(name) {
  const c = document.createElement('canvas');

  c.width = 80;
  c.height = 80;

  const ctx = c.getContext('2d');

  ctx.fillStyle = '#4F46E5';
  ctx.fillRect(0, 0, 80, 80);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Inter,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(initial(name), 40, 44);

  return c.toDataURL();
}

// ==============================
// INITIALISATION
// ==============================

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

// ==============================
// BOUTONS ET EVENEMENTS
// ==============================

function bind() {
  const gmail = document.getElementById('btn-gmail');

  if (gmail) {
    gmail.onclick = () => {
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
  const avatarInput = document.getElementById('avatar-input');

  if (avatarUpload && avatarInput) {
    avatarUpload.onclick = () => avatarInput.click();

    avatarInput.onchange = e => {
      const f = e.target.files[0];

      if (!f) return;

      const r = new FileReader();

      r.onload = ev => {
        state.user.avatar = ev.target.result;

        document.getElementById('avatar-preview').innerHTML =
          `<img src="${ev.target.result}" alt="Avatar">`;

        save();
      };

      r.readAsDataURL(f);
    };
  }

  const bio = document.getElementById('input-bio');

  if (bio) {
    bio.oninput = e => {
      document.getElementById('bio-count').textContent =
        e.target.value.length;
    };
  }

  const check = () => {
    const fn = document.getElementById('input-firstname').value.trim();

    const un = document.getElementById('input-username')
      .value.trim()
      .replace(/[^a-zA-Z0-9._]/g, '');

    document.getElementById('btn-save-profile').disabled =
      !(fn && un.length >= 3);
  };

  document.getElementById('input-firstname').oninput = check;
  document.getElementById('input-username').oninput = check;

  document.getElementById('btn-save-profile').onclick = () => {
    const fn = document.getElementById('input-firstname').value.trim();

    const un = document.getElementById('input-username')
      .value.trim()
      .replace(/[^a-zA-Z0-9._]/g, '');

    if (!fn || un.length < 3) {
      toast('Vérifie ton prénom et ton nom utilisateur.');
      return;
    }

    state.user.firstname = fn;
    state.user.username = un;
    state.user.bio = document.getElementById('input-bio').value.trim();
    state.user.ok = true;

    if (!state.user.avatar) {
      state.user.avatar = defaultAvatar(fn);
    }

    if (!save()) return;

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

  document.getElementById('btn-private-msg').onclick = () => {
    toast('Bientôt disponible');
  };

  document.getElementById('btn-back-create').onclick = () => {
    show('screen-home');
  };

  document.getElementById('btn-back-join').onclick = () => {
    show('screen-home');
  };

  document.getElementById('btn-back-space').onclick = () => {
    state.currentSpaceId = null;
    renderHome();
    show('screen-home');
  };

  document.getElementById('btn-confirm-create').onclick = createSpace;
  document.getElementById('btn-join-code').onclick = joinSpace;

  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => {
        x.classList.remove('active');
      });

      t.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.remove('active');
      });

      const panel = document.getElementById('tab-' + t.dataset.tab);

      if (panel) {
        panel.classList.add('active');
      }

      if (t.dataset.tab === 'plans') renderDecisions();
      if (t.dataset.tab === 'infos') renderInfos();
    };
  });

  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => {
        x.classList.remove('active');
      });

      c.classList.add('active');
      state.currentThread = c.dataset.thread;

      renderMessages();
    };
  });

  document.getElementById('btn-send-msg').onclick = sendMsg;

  document.getElementById('message-input').onkeypress = e => {
    if (e.key === 'Enter') sendMsg();
  };

  document.getElementById('btn-new-decision').onclick = () => {
    document.getElementById('decision-question').value = '';
    document.getElementById('decision-options').value = '';

    document.getElementById('modal-decision').classList.add('show');
  };

  document.getElementById('btn-cancel-decision').onclick = () => {
    document.getElementById('modal-decision').classList.remove('show');
  };

  document.getElementById('btn-confirm-decision').onclick = createDecision;

  document.getElementById('btn-copy-link').onclick = async () => {
    const input = document.getElementById('invite-link');

    try {
      await navigator.clipboard.writeText(input.value);
      toast('Lien copié !');
    } catch (e) {
      input.focus();
      input.select();

      const copied = document.execCommand('copy');

      toast(copied ? 'Lien copié !' : 'Impossible de copier le lien.');
    }
  };
}

// ==============================
// ACCUEIL
// ==============================

function renderHome() {
  if (!state.user) return;

  const av = document.getElementById('home-avatar');

  av.src = state.user.avatar || defaultAvatar(state.user.firstname);

  document.getElementById('home-name').textContent =
    state.user.firstname;

  const list = document.getElementById('spaces-list');
  const empty = document.getElementById('empty-spaces');

  list.innerHTML = '';

  if (!state.spaces.length) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  state.spaces.forEach(sp => {
    const d = document.createElement('div');
    d.className = 'space-card';

    const icon = document.createElement('div');
    icon.className = 'space-icon';
    icon.textContent = initial(sp.name);

    const details = document.createElement('div');

    const title = document.createElement('h3');
    title.textContent = sp.name;

    const info = document.createElement('p');
    const count = sp.members ? sp.members.length : 0;

    info.textContent =
      `${count} membre${count > 1 ? 's' : ''} · ${sp.code}`;

    details.appendChild(title);
    details.appendChild(info);

    d.appendChild(icon);
    d.appendChild(details);

    d.onclick = () => openSpace(sp.id);

    list.appendChild(d);
  });
}

// ==============================
// CREATION D'UN ESPACE
// ==============================

function createSpace() {
  try {
    const nameInput = document.getElementById('space-name');
    const descInput = document.getElementById('space-desc');

    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (!name) {
      toast('Donne un nom à ton espace.');
      return;
    }

    if (!state.user || !state.user.ok || !state.user.username) {
      toast('Erreur : profil utilisateur absent.');
      show('screen-profile');
      return;
    }

    const sp = {
      id: uid(),
      name: name,
      description: description,
      code: code(),
      link: window.location.origin +
        window.location.pathname +
        '?join=' + code(),
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

    if (!save()) {
      state.spaces.pop();
      delete state.messages[sp.id];
      delete state.decisions[sp.id];

      return;
    }

    renderHome();
    openSpace(sp.id);

    toast('Espace créé avec succès ! Code : ' + sp.code);

  } catch (error) {
    console.error('ERREUR CREATION ESPACE :', error);

    toast('Erreur : ' + error.message);
  }
}

// ==============================
// REJOINDRE UN ESPACE
// ==============================

function joinSpace() {
  const input = document.getElementById('join-code');
  const c = input.value.trim();

  if (!/^\d{6}$/.test(c)) {
    toast('Entre un code à 6 chiffres.');
    return;
  }

  const sp = state.spaces.find(s => s.code === c);

  if (!sp) {
    toast('Espace introuvable sur cet appareil.');
    return;
  }

  if (!state.user || !state.user.username) {
    toast('Crée d’abord ton profil.');
    show('screen-profile');
    return;
  }

  if (!sp.members.some(m => m.username === state.user.username)) {
    sp.members.push({
      username: state.user.username,
      firstname: state.user.firstname,
      avatar: state.user.avatar
    });

    if (!save()) {
      sp.members.pop();
      return;
    }
  }

  toast('Tu as rejoint « ' + sp.name + ' »');

  renderHome();
  openSpace(sp.id);
}

// ==============================
// OUVRIR UN ESPACE
// ==============================

function openSpace(id) {
  state.currentSpaceId = id;
  state.currentThread = 'general';

  const sp = state.spaces.find(s => s.id === id);

  if (!sp) return;

  document.getElementById('space-title').textContent = sp.name;

  document.getElementById('space-members-count').textContent =
    sp.members.length + ' membre' +
    (sp.members.length > 1 ? 's' : '');

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
  });

  const discussionTab =
    document.querySelector('.tab[data-tab="discussion"]');

  if (discussionTab) discussionTab.classList.add('active');

  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.remove('active');
  });

  document.getElementById('tab-discussion').classList.add('active');

  document.querySelectorAll('.chip').forEach(c => {
    c.classList.remove('active');
  });

  const generalChip =
    document.querySelector('.chip[data-thread="general"]');

  if (generalChip) generalChip.classList.add('active');

  renderMessages();
  renderDecisions();
  renderInfos();

  show('screen-space');
}

// ==============================
// MESSAGES
// ==============================

function renderMessages() {
  const area = document.getElementById('messages-area');

  area.innerHTML = '';

  const sid = state.currentSpaceId;
  const th = state.currentThread;

  if (!state.messages[sid]) {
    state.messages[sid] = {
      general: [],
      organisation: [],
      blabla: []
    };
  }

  if (!state.messages[sid][th]) {
    state.messages[sid][th] = [];
  }

  const msgs = state.messages[sid][th];

  if (!msgs.length) {
    area.innerHTML =
      '<div class="empty"><p>Aucun message.</p></div>';

    return;
  }

  msgs.forEach(m => {
    const d = document.createElement('div');

    d.className = 'msg ' + (m.mine ? 'mine' : 'other');

    if (!m.mine) {
      const who = document.createElement('div');
      who.className = 'who';
      who.textContent = m.author;

      d.appendChild(who);
    }

    const content = document.createElement('div');
    content.textContent = m.text;

    d.appendChild(content);
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

  if (!state.messages[sid]) {
    state.messages[sid] = {
      general: [],
      organisation: [],
      blabla: []
    };
  }

  if (!state.messages[sid][th]) {
    state.messages[sid][th] = [];
  }

  state.messages[sid][th].push({
    id: uid(),
    author: state.user.firstname,
    text: text,
    mine: true
  });

  if (!save()) {
    state.messages[sid][th].pop();
    return;
  }

  input.value = '';

  renderMessages();
}

// ==============================
// DECISIONS ET VOTES
// ==============================

function renderDecisions() {
  const list = document.getElementById('decisions-list');
  const cal = document.getElementById('calendar-view');

  list.innerHTML = '';

  const decs = state.decisions[state.currentSpaceId] || [];

  if (!decs.length) {
    cal.innerHTML = '<p>Aucune décision.<br>Lance-en une !</p>';
    return;
  }

  const voted = decs.filter(d =>
    d.options.some(o => o.votes > 0)
  );

  cal.innerHTML = '';

  if (voted.length) {
    voted.forEach(d => {
      const winner = d.options.reduce((a, b) =>
        a.votes >= b.votes ? a : b
      );

      const p = document.createElement('p');
      p.textContent = d.q + ' → ' + winner.text;

      cal.appendChild(p);
    });
  } else {
    cal.innerHTML = '<p>Votes en cours...</p>';
  }

  decs.forEach((d, di) => {
    const card = document.createElement('div');
    card.className = 'decision-card';

    const title = document.createElement('h4');
    title.textContent = d.q;

    card.appendChild(title);

    d.options.forEach((o, oi) => {
      const option = document.createElement('div');

      option.className = 'opt' + (o.me ? ' voted' : '');

      const label = document.createElement('span');
      label.textContent = o.text;

      const votes = document.createElement('span');
      votes.className = 'v';
      votes.textContent =
        o.votes + ' vote' + (o.votes > 1 ? 's' : '');

      option.appendChild(label);
      option.appendChild(votes);

      option.onclick = () => {
        const decision = state.decisions[state.currentSpaceId][di];

        const previous = decision.options.findIndex(opt => opt.me);

        if (previous === oi) return;

        if (previous !== -1) {
          decision.options[previous].votes = Math.max(
            0,
            decision.options[previous].votes - 1
          );

          decision.options[previous].me = false;
        }

        decision.options[oi].votes++;
        decision.options[oi].me = true;

        if (!save()) {
          decision.options[oi].votes--;
          decision.options[oi].me = false;

          if (previous !== -1) {
            decision.options[previous].votes++;
            decision.options[previous].me = true;
          }

          renderDecisions();
          return;
        }

        renderDecisions();
        toast('Vote enregistré !');
      };

      card.appendChild(option);
    });

    list.appendChild(card);
  });
}

function createDecision() {
  if (!state.currentSpaceId) {
    toast('Ouvre d’abord un espace.');
    return;
  }

  const q =
    document.getElementById('decision-question').value.trim();

  const raw =
    document.getElementById('decision-options').value.trim();

  if (!q || !raw) {
    toast('Remplis tous les champs.');
    return;
  }

  const opts = raw
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(t => ({
      text: t,
      votes: 0,
      me: false
    }));

  if (opts.length < 2) {
    toast('Il faut au moins 2 options.');
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

  if (!save()) {
    state.decisions[state.currentSpaceId].pop();
    return;
  }

  document.getElementById('modal-decision').classList.remove('show');

  renderDecisions();

  toast('Décision lancée !');
}

// ==============================
// INFORMATIONS DE L'ESPACE
// ==============================

function renderInfos() {
  const sp = state.spaces.find(s => s.id === state.currentSpaceId);

  if (!sp) return;

  document.getElementById('space-code-display').textContent = sp.code;

  document.getElementById('invite-link').value = sp.link;

  const list = document.getElementById('members-list');

  list.innerHTML = '';

  sp.members.forEach(m => {
    const li = document.createElement('li');

    const avatar = document.createElement('div');
    avatar.className = 'm-avatar';
    avatar.textContent = initial(m.firstname);

    const label = document.createElement('span');
    label.textContent = m.firstname + ' ';

    const username = document.createElement('small');
    username.style.color = '#A1A1AA';
    username.textContent = '@' + m.username;

    label.appendChild(username);
    li.appendChild(avatar);
    li.appendChild(label);

    list.appendChild(li);
  });
    }
