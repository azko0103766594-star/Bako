/* spaces.js – Gestion des espaces (home, create, join, open) */

function renderHome() {
  if (!state.user) return;
  document.getElementById('home-avatar').src = state.user.avatar || defaultAvatar(state.user.firstname || 'U');
  document.getElementById('home-name').textContent = state.user.firstname || 'Utilisateur';
  const codeEl = document.getElementById('home-code');
  if (codeEl) codeEl.textContent = 'Mon code : ' + (state.user.personalCode || '------');

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
      d.innerHTML = '<div class="space-icon">' + initial(sp.name) + '</div><div><h3>' + sp.name + '</h3><p>' +
        (sp.members ? sp.members.length : 0) + ' membre' + ((sp.members && sp.members.length > 1) ? 's' : '') +
        ' · ' + (sp.code || '') + '</p></div>';
      d.onclick = () => openSpace(sp.id);
      list.appendChild(d);
    });
  }
}

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

function getMemberAvatar(authorName) {
  if (!state.currentSpaceId || !authorName) return state.user && state.user.avatar ? state.user.avatar : '';
  const sp = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!sp || !sp.members) return '';
  const m = sp.members.find(x => x.firstname === authorName || x.username === authorName);
  return (m && m.avatar) ? m.avatar : (state.user && state.user.firstname === authorName ? state.user.avatar : '');
}
