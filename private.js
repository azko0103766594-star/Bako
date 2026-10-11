/* private.js – Messages privés par code + synchronisation API */

// ========== PRIVATE CHAT (par code) ==========

function renderPrivateList() {
  const myCodeEl = document.getElementById('my-personal-code');
  if (myCodeEl && state.user) {
    myCodeEl.textContent = state.user.personalCode || '------';
  }

  const list = document.getElementById('private-list');
  const empty = document.getElementById('empty-private');
  if (!list || !empty) return;
  list.innerHTML = '';

  const searchQ = ((document.getElementById('private-search') || {}).value || '').trim().toLowerCase();
  const filter = state.privateFilter || 'all';

  let keys = Object.keys(state.privateChats || {});

  // Filter archived / pinned
  keys = keys.filter(pCode => {
    const chat = state.privateChats[pCode];
    if (filter === 'archived') return !!chat.archived;
    if (filter === 'pinned') return !!chat.pinned && !chat.archived;
    return !chat.archived; // "all" = non-archived
  });

  // Search
  if (searchQ) {
    keys = keys.filter(pCode => {
      const chat = state.privateChats[pCode];
      const name = (chat.otherName || '').toLowerCase();
      const code = pCode.toLowerCase();
      const last = (chat.messages && chat.messages.length)
        ? (chat.messages[chat.messages.length - 1].text || '').toLowerCase()
        : '';
      return name.includes(searchQ) || code.includes(searchQ) || last.includes(searchQ);
    });
  }

  if (!keys.length) {
    empty.style.display = 'block';
    empty.innerHTML = filter === 'archived'
      ? '<p>Aucune conversation archivée.</p>'
      : filter === 'pinned'
        ? '<p>Aucune conversation épinglée.</p>'
        : '<p>Aucun message privé.</p><p>Entre le code d\'un ami pour démarrer.</p>';
    return;
  }
  empty.style.display = 'none';

  // Sort: pinned first, then by updatedAt
  keys.sort((a, b) => {
    const ca = state.privateChats[a];
    const cb = state.privateChats[b];
    if (ca.pinned && !cb.pinned) return -1;
    if (!ca.pinned && cb.pinned) return 1;
    return (cb.updatedAt || 0) - (ca.updatedAt || 0);
  });

  keys.forEach(pCode => {
    const chat = state.privateChats[pCode];
    const lastMsg = chat.messages && chat.messages.length ? chat.messages[chat.messages.length - 1] : null;
    let lastText = 'Aucun message';
    if (lastMsg) {
      if (lastMsg.type === 'image') lastText = '📷 Image';
      else if (lastMsg.type === 'video') lastText = '🎥 Vidéo';
      else if (lastMsg.type === 'audio') lastText = '🎤 Vocal';
      else lastText = (lastMsg.text || '').substring(0, 28);
    }
    const timeStr = lastMsg && lastMsg.time ? formatTime(lastMsg.time) : '';
    const avHtml = chat.otherAvatar
      ? '<img src="' + chat.otherAvatar + '" alt="">'
      : initial(chat.otherName || 'A');
    const onlineHtml = chat.online ? '<span class="online-indicator" title="En ligne"></span>' : '';
    const unread = chat.unread || 0;
    const badgeHtml = unread > 0 ? '<span class="unread-badge">' + (unread > 99 ? '99+' : unread) + '</span>' : '';
    const pinIcon = chat.pinned ? '<span class="pin-icon">📌</span>' : '';

    const d = document.createElement('div');
    d.className = 'private-card' + (chat.pinned ? ' pinned' : '');
    d.innerHTML =
      '<div class="space-icon">' + avHtml + onlineHtml + '</div>' +
      '<div class="info">' +
        '<h3>' + pinIcon + (chat.otherName || 'Ami') + (chat.online ? ' <span class="online-dot"></span>' : '') + '</h3>' +
        '<p class="last-msg">' + lastText + '</p>' +
        '<p class="meta">' + (timeStr ? timeStr + ' · ' : '') + 'Code ' + pCode + '</p>' +
      '</div>' + badgeHtml;
    d.onclick = () => openPrivateChat(pCode);
    list.appendChild(d);
  });
}

function startPrivateChat() {
  const input = document.getElementById('private-code-input');
  const pCode = (input.value || '').trim();

  if (pCode.length !== 6 || !/^\d{6}$/.test(pCode)) {
    toast('Entre un code à 6 chiffres');
    return;
  }

  if (state.user && pCode === state.user.personalCode) {
    toast('C\'est ton propre code');
    return;
  }

  // Appel API pour démarrer / récupérer le chat
  startPrivateChatApi(pCode)
    .then(data => {
      if (!state.privateChats[pCode]) {
        state.privateChats[pCode] = {
          otherName: data.otherName || 'Ami ' + pCode.slice(-2),
          otherCode: pCode,
          otherAvatar: data.otherAvatar || null,
          messages: [],
          unread: 0,
          online: false,
          pinned: false,
          archived: false,
          updatedAt: Date.now()
        };
        save();
      } else {
        // Mettre à jour les infos
        state.privateChats[pCode].otherName = data.otherName || state.privateChats[pCode].otherName;
        state.privateChats[pCode].otherAvatar = data.otherAvatar || state.privateChats[pCode].otherAvatar;
        save();
      }

      input.value = '';
      openPrivateChat(pCode);
    })
    .catch(err => {
      console.error(err);
      toast(err.message || 'Impossible de démarrer le chat');
    });
}

function openPrivateChat(pCode) {
  state.currentPrivateCode = pCode;

  if (!state.privateChats[pCode]) {
    state.privateChats[pCode] = {
      otherName: 'Ami',
      otherCode: pCode,
      otherAvatar: null,
      messages: [],
      unread: 0,
      online: false,
      pinned: false,
      archived: false,
      updatedAt: Date.now()
    };
  }

  // Mark as read
  state.privateChats[pCode].unread = 0;
  save();

  const chat = state.privateChats[pCode];
  document.getElementById('private-chat-name').textContent = chat.otherName || 'Chat privé';
  document.getElementById('private-chat-code').textContent = 'Code : ' + pCode;

  const onlineDot = document.getElementById('private-online-dot');
  if (onlineDot) {
    onlineDot.style.display = chat.online ? 'inline-block' : 'none';
  }

  // Charger les messages depuis le serveur + démarrer le polling
  loadPrivateMessages(pCode);
  startPrivatePolling(pCode);

  renderPrivateMessages();
  show('screen-private-chat');
}

function renderPrivateMessages() {
  const area = document.getElementById('private-messages-area');
  if (!area) return;
  area.innerHTML = '';

  const chat = state.privateChats[state.currentPrivateCode];
  if (!chat || !chat.messages || !chat.messages.length) {
    area.innerHTML = '<div class="empty"><p>Aucun message.<br>Dis bonjour !</p></div>';
    return;
  }

  // Show only non-deleted-for-me messages
  const visible = chat.messages.filter(m => !m.deletedForMe);

  if (!visible.length) {
    area.innerHTML = '<div class="empty"><p>Aucun message.<br>Dis bonjour !</p></div>';
    return;
  }

  visible.forEach(m => {
    const row = document.createElement('div');
    row.className = 'msg-row ' + (m.mine ? 'mine' : 'other');
    row.dataset.msgId = m.id;

    const avSrc = m.mine
      ? (state.user && state.user.avatar ? state.user.avatar : defaultAvatar(state.user ? state.user.firstname : 'U'))
      : (chat.otherAvatar || defaultAvatar(chat.otherName || 'A'));

    const av = document.createElement('img');
    av.className = 'msg-avatar';
    av.src = avSrc;
    av.alt = '';
    av.style.cursor = 'pointer';
    av.onclick = (e) => { e.stopPropagation(); openLightbox(avSrc); };

    const bubble = document.createElement('div');
    bubble.className = 'msg ' + (m.mine ? 'mine' : 'other');
    let pinBadge = m.pinned ? '<div class="msg-pinned-badge">📌 Épinglé</div>' : '';
    bubble.innerHTML = pinBadge + buildMsgHtml(m);

    bubble.querySelectorAll('img.media-img').forEach(img => {
      img.style.cursor = 'pointer';
      img.onclick = (e) => { e.stopPropagation(); openLightbox(img.src); };
    });

    row.appendChild(av);
    row.appendChild(bubble);

    // Long press / click to open actions
    let pressTimer = null;
    row.addEventListener('touchstart', e => {
      pressTimer = setTimeout(() => openMsgActions(m.id), 500);
    }, { passive: true });
    row.addEventListener('touchend', () => clearTimeout(pressTimer));
    row.addEventListener('touchmove', () => clearTimeout(pressTimer));
    row.addEventListener('contextmenu', e => {
      e.preventDefault();
      openMsgActions(m.id);
    });
    row.addEventListener('dblclick', () => openMsgActions(m.id));

    area.appendChild(row);
  });

  bindMediaSources(area, visible);
  area.scrollTop = area.scrollHeight;
}

async function sendPrivateMsg() {
  const input = document.getElementById('private-message-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !state.currentPrivateCode) return;

  const pCode = state.currentPrivateCode;

  if (!state.privateChats[pCode]) {
    state.privateChats[pCode] = {
      otherName: 'Ami',
      messages: [],
      unread: 0,
      online: false,
      updatedAt: Date.now()
    };
  }

  const chat = state.privateChats[pCode];

  // Optimistic UI (affiche tout de suite)
  const tempMsg = {
    id: uid(),
    author: state.user.firstname,
    text,
    mine: true,
    type: 'text',
    time: Date.now(),
    avatar: state.user.avatar || ''
  };
  chat.messages.push(tempMsg);
  chat.updatedAt = Date.now();
  save();
  input.value = '';
  renderPrivateMessages();

  // Envoi réel au serveur
  try {
    await sendPrivateMessageApi(pCode, {
      text,
      type: 'text'
    });
  } catch (err) {
    console.error(err);
    toast('Erreur d\'envoi du message');
  }
}

// ========== SYNCHRONISATION API + POLLING ==========

async function loadPrivateMessages(pCode) {
  try {
    const data = await getPrivateMessagesApi(pCode);

    if (!state.privateChats[pCode]) {
      state.privateChats[pCode] = {
        otherName: 'Ami',
        otherCode: pCode,
        otherAvatar: null,
        messages: [],
        unread: 0,
        online: false,
        pinned: false,
        archived: false,
        updatedAt: Date.now()
      };
    }

    const chat = state.privateChats[pCode];

    // Conversion format API → format local
    chat.messages = (data.messages || []).map(m => ({
      id: m.id,
      author: m.author_name || '',
      text: m.content || '',
      mine: m.author_id === (state.user && state.user.id),
      type: m.type || 'text',
      media: m.media_url || null,
      duration: m.duration || 0,
      time: (m.created_at || Date.now() / 1000) * 1000,
      avatar: m.author_avatar || ''
    }));

    chat.updatedAt = Date.now();
    save();

    if (state.currentPrivateCode === pCode) {
      renderPrivateMessages();
    }
  } catch (err) {
    console.error('loadPrivateMessages', err);
  }
}

let privatePollInterval = null;

function startPrivatePolling(pCode) {
  stopPrivatePolling();
  privatePollInterval = setInterval(() => {
    if (state.currentPrivateCode === pCode) {
      loadPrivateMessages(pCode);
    }
  }, 2500); // toutes les 2,5 secondes
}

function stopPrivatePolling() {
  if (privatePollInterval) {
    clearInterval(privatePollInterval);
    privatePollInterval = null;
  }
}

// À appeler quand on quitte le chat privé
function closePrivateChat() {
  stopPrivatePolling();
  state.currentPrivateCode = null;
  show('screen-private'); // adapte le nom de ton écran liste si besoin
      }
