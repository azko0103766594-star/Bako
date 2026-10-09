// ==================== STATE ====================
const state = {
  user: null,
  spaces: [],
  currentSpaceId: null,
  currentThread: 'general',
  messages: {},      // spaceId -> thread -> messages[]
  decisions: {},     // spaceId -> decisions[]
};

// Load from localStorage
function loadState() {
  const saved = localStorage.getItem('align_state');
  if (saved) {
    const parsed = JSON.parse(saved);
    state.user = parsed.user || null;
    state.spaces = parsed.spaces || [];
    state.messages = parsed.messages || {};
    state.decisions = parsed.decisions || {};
  }
}

function saveState() {
  localStorage.setItem('align_state', JSON.stringify({
    user: state.user,
    spaces: state.spaces,
    messages: state.messages,
    decisions: state.decisions,
  }));
}

// ==================== HELPERS ====================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getInitials(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  if (state.user && state.user.profileComplete) {
    renderHome();
    showScreen('screen-home');
  } else if (state.user) {
    showScreen('screen-profile');
  } else {
    showScreen('screen-login');
  }

  bindEvents();
});

// ==================== EVENTS ====================
function bindEvents() {
  // Login
  document.getElementById('btn-gmail').addEventListener('click', handleGmailLogin);

  // Profile
  document.getElementById('avatar-upload').addEventListener('click', () => {
    document.getElementById('avatar-input').click();
  });
  document.getElementById('avatar-input').addEventListener('change', handleAvatarChange);
  document.getElementById('input-bio').addEventListener('input', (e) => {
    document.getElementById('bio-count').textContent = e.target.value.length;
  });
  ['input-firstname', 'input-username'].forEach(id => {
    document.getElementById(id).addEventListener('input', checkProfileForm);
  });
  document.getElementById('btn-save-profile').addEventListener('click', saveProfile);

  // Home nav
  document.getElementById('btn-create-space').addEventListener('click', () => showScreen('screen-create'));
  document.getElementById('btn-join-space').addEventListener('click', () => showScreen('screen-join'));
  document.getElementById('btn-private-msg').addEventListener('click', () => {
    showToast('Messages privés – bientôt disponible');
  });

  // Create space
  document.getElementById('btn-back-create').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-confirm-create').addEventListener('click', createSpace);
  document.getElementById('cover-upload').addEventListener('click', () => {
    document.getElementById('cover-input').click();
  });

  // Join space
  document.getElementById('btn-back-join').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-join-code').addEventListener('click', joinByCode);
  document.getElementById('btn-scan-qr').addEventListener('click', () => {
    showToast('Scan QR simulé – entre un code à 6 chiffres');
  });
  document.getElementById('btn-proximity').addEventListener('click', () => {
    showToast('Mode proximité – bientôt disponible');
  });

  // Space detail
  document.getElementById('btn-back-space').addEventListener('click', () => {
    state.currentSpaceId = null;
    renderHome();
    showScreen('screen-home');
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Threads
  document.querySelectorAll('.thread-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.thread-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentThread = chip.dataset.thread;
      renderMessages();
    });
  });

  // Send message
  document.getElementById('btn-send-msg').addEventListener('click', sendMessage);
  document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Decision modal
  document.getElementById('btn-new-decision').addEventListener('click', () => {
    document.getElementById('modal-decision').classList.add('active');
  });
  document.getElementById('btn-cancel-decision').addEventListener('click', () => {
    document.getElementById('modal-decision').classList.remove('active');
  });
  document.getElementById('btn-confirm-decision').addEventListener('click', createDecision);

  // Copy link
  document.getElementById('btn-copy-link').addEventListener('click', () => {
    const input = document.getElementById('invite-link');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => showToast('Lien copié !'));
  });
}

// ==================== LOGIN ====================
function handleGmailLogin() {
  // Simulate Gmail login
  state.user = {
    email: 'demo@gmail.com',
    profileComplete: false,
    avatar: null,
    firstname: '',
    lastname: '',
    username: '',
    bio: '',
  };
  saveState();
  showScreen('screen-profile');
}

// ==================== PROFILE ====================
function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.user.avatar = ev.target.result;
    const preview = document.getElementById('avatar-preview');
    preview.innerHTML = `<img src="${ev.target.result}" alt="Avatar">`;
    checkProfileForm();
  };
  reader.readAsDataURL(file);
}

function checkProfileForm() {
  const firstname = document.getElementById('input-firstname').value.trim();
  const username = document.getElementById('input-username').value.trim();
  const hasAvatar = !!state.user.avatar;
  document.getElementById('btn-save-profile').disabled = !(firstname && username && hasAvatar);
}

function saveProfile() {
  state.user.firstname = document.getElementById('input-firstname').value.trim();
  state.user.lastname = document.getElementById('input-lastname').value.trim();
  state.user.username = document.getElementById('input-username').value.trim();
  state.user.bio = document.getElementById('input-bio').value.trim();
  state.user.profileComplete = true;
  saveState();
  renderHome();
  showScreen('screen-home');
  showToast('Profil créé avec succès !');
}

// ==================== HOME ====================
function renderHome() {
  const avatar = document.getElementById('home-avatar');
  const name = document.getElementById('home-name');
  if (state.user.avatar) {
    avatar.src = state.user.avatar;
  } else {
    avatar.src = '';
    avatar.style.background = 'var(--primary)';
  }
  name.textContent = state.user.firstname || 'Utilisateur';

  const list = document.getElementById('spaces-list');
  const empty = document.getElementById('empty-spaces');
  list.innerHTML = '';

  if (state.spaces.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    state.spaces.forEach(space => {
      const card = document.createElement('div');
      card.className = 'space-card';
      card.innerHTML = `
        <div class="space-card-icon">${getInitials(space.name)}</div>
        <div class="space-card-info">
          <h3>${space.name}</h3>
          <p>${space.members.length} membre${space.members.length > 1 ? 's' : ''} · Code ${space.code}</p>
        </div>
      `;
      card.addEventListener('click', () => openSpace(space.id));
      list.appendChild(card);
    });
  }
}

// ==================== CREATE SPACE ====================
function createSpace() {
  const name = document.getElementById('space-name').value.trim();
  if (!name) {
    showToast('Donne un nom à l\'espace');
    return;
  }

  const space = {
    id: generateId(),
    name,
    description: document.getElementById('space-desc').value.trim(),
    code: generateCode(),
    link: `https://align.app/join/${generateId()}`,
    members: [{
      username: state.user.username,
      firstname: state.user.firstname,
      avatar: state.user.avatar,
    }],
    createdAt: Date.now(),
  };

  state.spaces.push(space);
  state.messages[space.id] = {
    general: [{
      id: generateId(),
      author: 'Align',
      text: `Bienvenue dans « ${space.name} » ! Commencez à organiser vos plans.`,
      mine: false,
      time: Date.now(),
    }],
    organisation: [],
    blabla: [],
    important: [],
  };
  state.decisions[space.id] = [];
  saveState();

  // Reset form
  document.getElementById('space-name').value = '';
  document.getElementById('space-desc').value = '';

  showToast(`Espace « ${space.name} » créé !`);
  openSpace(space.id);
}

// ==================== JOIN SPACE ====================
function joinByCode() {
  const code = document.getElementById('join-code').value.trim();
  if (code.length !== 6) {
    showToast('Entre un code à 6 chiffres');
    return;
  }

  const space = state.spaces.find(s => s.code === code);
  if (!space) {
    // Demo: create a fake space if code not found (for testing)
    showToast('Aucun espace trouvé avec ce code. Crée-en un d\'abord !');
    return;
  }

  // Check if already member
  const already = space.members.some(m => m.username === state.user.username);
  if (!already) {
    space.members.push({
      username: state.user.username,
      firstname: state.user.firstname,
      avatar: state.user.avatar,
    });
    saveState();
  }

  document.getElementById('join-code').value = '';
  showToast(`Tu as rejoint « ${space.name} »`);
  openSpace(space.id);
}

// ==================== SPACE DETAIL ====================
function openSpace(spaceId) {
  state.currentSpaceId = spaceId;
  state.currentThread = 'general';
  const space = state.spaces.find(s => s.id === spaceId);
  if (!space) return;

  document.getElementById('space-title').textContent = space.name;
  document.getElementById('space-members-count').textContent = `${space.members.length} membre${space.members.length > 1 ? 's' : ''}`;

  // Reset tabs
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab[data-tab="discussion"]').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-discussion').classList.add('active');

  // Reset threads
  document.querySelectorAll('.thread-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.thread-chip[data-thread="general"]').classList.add('active');

  renderMessages();
  renderDecisions();
  renderInfos(space);

  showScreen('screen-space');
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');

  if (tabName === 'plans') renderDecisions();
  if (tabName === 'infos') {
    const space = state.spaces.find(s => s.id === state.currentSpaceId);
    if (space) renderInfos(space);
  }
}

// ==================== MESSAGES ====================
function renderMessages() {
  const area = document.getElementById('messages-area');
  area.innerHTML = '';
  const spaceId = state.currentSpaceId;
  const thread = state.currentThread;

  if (!state.messages[spaceId]) state.messages[spaceId] = { general: [], organisation: [], blabla: [], important: [] };
  if (!state.messages[spaceId][thread]) state.messages[spaceId][thread] = [];

  const msgs = state.messages[spaceId][thread];
  if (msgs.length === 0) {
    area.innerHTML = `<div class="empty-state"><p>Aucun message dans ce sujet.</p><p>Sois le premier à écrire !</p></div>`;
    return;
  }

  msgs.forEach(msg => {
    const div = document.createElement('div');
    div.className = `message ${msg.mine ? 'mine' : 'other'}`;
    div.innerHTML = `
      ${!msg.mine ? `<div class="author">${msg.author}</div>` : ''}
      <div>${msg.text}</div>
    `;
    area.appendChild(div);
  });
  area.scrollTop = area.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !state.currentSpaceId) return;

  const spaceId = state.currentSpaceId;
  const thread = state.currentThread;

  if (!state.messages[spaceId]) state.messages[spaceId] = { general: [], organisation: [], blabla: [], important: [] };
  if (!state.messages[spaceId][thread]) state.messages[spaceId][thread] = [];

  state.messages[spaceId][thread].push({
    id: generateId(),
    author: state.user.firstname,
    text,
    mine: true,
    time: Date.now(),
  });
  saveState();
  input.value = '';
  renderMessages();
}

// ==================== DECISIONS / PLANS ====================
function renderDecisions() {
  const list = document.getElementById('decisions-list');
  list.innerHTML = '';
  const spaceId = state.currentSpaceId;
  const decisions = state.decisions[spaceId] || [];

  const calendar = document.getElementById('calendar-view');
  if (decisions.length === 0) {
    calendar.innerHTML = '<p>Aucun plan pour le moment.<br>Lance une décision pour commencer.</p>';
  } else {
    const validated = decisions.filter(d => d.validated);
    if (validated.length > 0) {
      calendar.innerHTML = validated.map(d => {
        const winner = d.options.reduce((a, b) => a.votes > b.votes ? a : b);
        return `<p><strong>${d.question}</strong><br>→ ${winner.text}</p>`;
      }).join('');
    } else {
      calendar.innerHTML = '<p>Des votes sont en cours...</p>';
    }
  }

  if (decisions.length === 0) {
    list.innerHTML = '<p class="hint" style="text-align:center;color:var(--text-muted)">Aucune décision en cours.</p>';
    return;
  }

  decisions.forEach((dec, idx) => {
    const card = document.createElement('div');
    card.className = 'decision-card';
    let optionsHtml = dec.options.map((opt, i) => `
      <div class="decision-option ${opt.votedByMe ? 'voted' : ''}" data-dec="${idx}" data-opt="${i}">
        <span>${opt.text}</span>
        <span class="votes">${opt.votes} vote${opt.votes > 1 ? 's' : ''}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <h4>${dec.question}</h4>
      ${optionsHtml}
      ${dec.validated ? '<div class="decision-status">✓ Décision verrouillée</div>' : '<div class="decision-status" style="color:var(--text-muted)">Vote en cours...</div>'}
    `;
    list.appendChild(card);
  });

  // Vote handlers
  list.querySelectorAll('.decision-option').forEach(el => {
    el.addEventListener('click', () => {
      const decIdx = parseInt(el.dataset.dec);
      const optIdx = parseInt(el.dataset.opt);
      voteDecision(decIdx, optIdx);
    });
  });
}

function createDecision() {
  const question = document.getElementById('decision-question').value.trim();
  const optionsRaw = document.getElementById('decision-options').value.trim();
  if (!question || !optionsRaw) {
    showToast('Remplis la question et les options');
    return;
  }

  const options = optionsRaw.split('\n').map(o => o.trim()).filter(Boolean).map(text => ({
    text,
    votes: 0,
    votedByMe: false,
  }));

  if (options.length < 2) {
    showToast('Ajoute au moins 2 options');
    return;
  }

  const spaceId = state.currentSpaceId;
  if (!state.decisions[spaceId]) state.decisions[spaceId] = [];

  state.decisions[spaceId].push({
    id: generateId(),
    question,
    options,
    validated: false,
    deadline: document.getElementById('decision-deadline').value,
    createdAt: Date.now(),
  });
  saveState();

  document.getElementById('decision-question').value = '';
  document.getElementById('decision-options').value = '';
  document.getElementById('modal-decision').classList.remove('active');
  renderDecisions();
  showToast('Décision lancée !');
}

function voteDecision(decIdx, optIdx) {
  const spaceId = state.currentSpaceId;
  const dec = state.decisions[spaceId][decIdx];
  if (dec.validated) {
    showToast('Cette décision est déjà verrouillée');
    return;
  }

  // Remove previous vote
  dec.options.forEach(opt => {
    if (opt.votedByMe) {
      opt.votes = Math.max(0, opt.votes - 1);
      opt.votedByMe = false;
    }
  });

  // Add new vote
  dec.options[optIdx].votes += 1;
  dec.options[optIdx].votedByMe = true;

  // Auto-validate if simple demo (optional: after first vote for demo)
  // For realism we keep it open, user can manually lock later if needed

  saveState();
  renderDecisions();
  showToast('Vote enregistré');
}

// ==================== INFOS ====================
function renderInfos(space) {
  document.getElementById('invite-link').value = space.link;
  document.getElementById('space-code-display').textContent = space.code;

  const membersList = document.getElementById('members-list');
  membersList.innerHTML = space.members.map(m => `
    <li>
      <div class="member-avatar">${getInitials(m.firstname)}</div>
      <span>${m.firstname} <small style="color:var(--text-muted)">@${m.username}</small></span>
    </li>
  `).join('');

  const summary = document.getElementById('decisions-summary');
  const decisions = state.decisions[space.id] || [];
  const validated = decisions.filter(d => d.validated || d.options.some(o => o.votes > 0));
  if (validated.length === 0) {
    summary.innerHTML = '<p class="hint">Aucune décision pour le moment.</p>';
  } else {
    summary.innerHTML = validated.map(d => {
      const top = d.options.reduce((a, b) => a.votes >= b.votes ? a : b);
      return `<p>• <strong>${d.question}</strong> → ${top.text} (${top.votes} vote${top.votes > 1 ? 's' : ''})</p>`;
    }).join('');
  }
}
