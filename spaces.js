/* spaces.js – Gestion des espaces (API + local) */

async function refreshSpacesFromApi() {
  if (typeof listSpacesApi !== 'function') return;
  try {
    const data = await listSpacesApi();
    const list = data.spaces || data || [];
    if (!Array.isArray(list)) return;

    // Fusionner avec l'existant (garder messages locaux liés)
    const byId = {};
    (state.spaces || []).forEach(s => { byId[s.id] = s; });

    state.spaces = list.map(s => {
      const prev = byId[s.id] || {};
      return {
        id: s.id,
        name: s.name,
        description: s.description || '',
        code: s.code,
        link: getBaseUrl() + '/?code=' + s.code,
        members: prev.members || [],
        owner_id: s.owner_id
      };
    });
    if (typeof save === 'function') save();
    if (typeof renderHome === 'function') renderHome();
  } catch (e) {
    console.error('refreshSpacesFromApi', e);
  }
}

function renderHome() {
  if (!state.user) return;
  const av = document.getElementById('home-avatar');
  if (av) av.src = state.user.avatar || defaultAvatar(state.user.firstname || 'U');
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = state.user.firstname || 'Utilisateur';
  const codeEl = document.getElementById('home-code');
  if (codeEl) codeEl.textContent = 'Mon code : ' + (state.user.personalCode || '------');

  const list = document.getElementById('spaces-list');
  const empty = document.getElementById('empty-spaces');
  if (!list) return;
  list.innerHTML = '';

  if (!state.spaces || !state.spaces.length) {
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
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

async function createSpace() {
  if (!state.user || !state.user.ok) { toast('Crée ton profil d\'abord'); return; }
  const name = (document.getElementById('space-name').value || '').trim();
  if (!name) { toast('Donne un nom'); return; }
  const description = (document.getElementById('space-desc') && document.getElementById('space-desc').value || '').trim();

  try {
    toast('Création…');
    let sp;
    if (typeof createSpaceApi === 'function') {
      const data = await createSpaceApi(name, description);
      sp = {
        id: data.id,
        name: data.name || name,
        description: data.description || description,
        code: data.code,
        link: getBaseUrl() + '/?code=' + data.code,
        members: [{
          id: state.user.id,
          username: state.user.username,
          firstname: state.user.firstname,
          avatar: state.user.avatar
        }]
      };
    } else {
      // fallback local
      const newCode = code();
      const newId = uid();
      sp = {
        id: newId,
        name,
        description,
        code: newCode,
        link: getBaseUrl() + '/?code=' + newCode,
        members: [{ username: state.user.username, firstname: state.user.firstname, avatar: state.user.avatar }]
      };
    }

    const exists = state.spaces.find(s => s.id === sp.id);
    if (!exists) state.spaces.push(sp);
    state.messages[sp.id] = state.messages[sp.id] || {
      general: [{ id: uid(), author: 'Align', text: 'Bienvenue dans « ' + name + ' » !', mine: false }],
      organisation: [],
      blabla: []
    };
    state.decisions[sp.id] = state.decisions[sp.id] || [];
    save();
    toast('Espace créé ! Code : ' + sp.code);
    if (document.getElementById('space-name')) document.getElementById('space-name').value = '';
    openSpace(sp.id);
  } catch (err) {
    console.error(err);
    toast(err.message || 'Impossible de créer l\'espace');
  }
}

async function joinSpace() {
  if (!state.user || !state.user.ok) { toast('Crée ton profil d\'abord'); return; }
  const c = (document.getElementById('join-code').value || '').trim();
  if (c.length !== 6) { toast('Code à 6 chiffres'); return; }

  try {
    toast('Connexion à l\'espace…');
    let sp;
    if (typeof joinSpaceApi === 'function') {
      const data = await joinSpaceApi(c);
      const space = data.space || data;
      sp = {
        id: space.id,
        name: space.name,
        description: space.description || '',
        code: space.code || c,
        link: getBaseUrl() + '/?code=' + (space.code || c),
        members: []
      };
    } else {
      sp = state.spaces.find(s => s.code === c);
      if (!sp) { toast('Espace introuvable'); return; }
      if (!sp.members) sp.members = [];
      if (!sp.members.some(m => m.username === state.user.username)) {
        sp.members.push({ username: state.user.username, firstname: state.user.firstname, avatar: state.user.avatar });
      }
    }

    if (!state.spaces.find(s => s.id === sp.id)) {
      state.spaces.push(sp);
    } else {
      const i = state.spaces.findIndex(s => s.id === sp.id);
      state.spaces[i] = Object.assign({}, state.spaces[i], sp);
    }
    if (!state.messages[sp.id]) {
      state.messages[sp.id] = { general: [], organisation: [], blabla: [] };
    }
    save();
    toast('Tu as rejoint « ' + sp.name + ' »');
    if (document.getElementById('join-code')) document.getElementById('join-code').value = '';
    openSpace(sp.id);
  } catch (err) {
    console.error(err);
    toast(err.message || 'Impossible de rejoindre');
  }
}

function openSpace(id) {
  state.currentSpaceId = id;
  if (typeof ensureCallPolling === 'function') ensureCallPolling();
  else if (window.alignStartCallPolling) window.alignStartCallPolling();
  state.currentThread = 'general';
  const sp = state.spaces.find(s => s.id === id);
  if (!sp) { toast('Espace introuvable'); return; }

  document.getElementById('space-title').textContent = sp.name;
  document.getElementById('space-members-count').textContent =
    (sp.members ? sp.members.length : 0) + ' membre' + ((sp.members && sp.members.length > 1) ? 's' : '');

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tabDisc = document.querySelector('.tab[data-tab="discussion"]');
  if (tabDisc) tabDisc.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('tab-discussion');
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  const chip = document.querySelector('.chip[data-thread="general"]');
  if (chip) chip.classList.add('active');

  renderMessages();
  if (typeof renderDecisions === 'function') renderDecisions();
  if (typeof renderInfos === 'function') renderInfos();
  show('screen-space');

  // Charger messages depuis le serveur + polling
  if (typeof loadSpaceMessages === 'function') loadSpaceMessages(id);
  if (typeof startSpacePolling === 'function') startSpacePolling(id);

  // Membres (id + personal_code)
  if (typeof api === 'function') {
    api('/api/spaces/' + id).then(data => {
      if (data && data.members) {
        const sp2 = state.spaces.find(s => s.id === id);
        if (sp2) {
          sp2.members = data.members.map(m => ({
            id: m.id,
            firstname: m.firstname,
            username: m.username,
            avatar: m.avatar_url || m.avatar,
            personal_code: m.personal_code,
            personalCode: m.personal_code
          }));
          if (data.name) sp2.name = data.name;
          if (data.code) sp2.code = data.code;
          if (typeof save === 'function') save();
          const countEl = document.getElementById('space-members-count');
          if (countEl) {
            countEl.textContent = sp2.members.length + ' membre' + (sp2.members.length > 1 ? 's' : '');
          }
          if (typeof renderInfos === 'function') renderInfos();
        }
      }
    }).catch(function () {});
  }
}

function getMemberAvatar(authorName) {
  if (!state.currentSpaceId || !authorName) return state.user && state.user.avatar ? state.user.avatar : '';
  const sp = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!sp || !sp.members) return '';
  const m = sp.members.find(x => x.firstname === authorName || x.username === authorName);
  return (m && m.avatar) ? m.avatar : (state.user && state.user.firstname === authorName ? state.user.avatar : '');
}
