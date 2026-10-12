/* messages.js – Messages d’espace (rendu, envoi, médias) + synchronisation API */

function buildMsgHtml(m) {
  let content = '';
  if (m.type === 'image' && m.media) {
    content =
      '<div class="media-wrap">' +
        '<img class="media-img" src="' + m.media + '" alt="image">' +
        '<button type="button" class="media-dl-btn" data-url="' + m.media + '" data-name="image.jpg" title="Télécharger">⬇</button>' +
      '</div>';
    if (m.text) content += '<div class="media-caption">' + m.text + '</div>';
  } else if (m.type === 'video' && m.media) {
    const durLabel = m.duration ? Math.round(m.duration) + 's' : '';
    content =
      '<div class="wa-video media-wrap">' +
        '<video class="media-video" playsinline webkit-playsinline preload="metadata" data-mediasrc="1"></video>' +
        '<div class="wa-video-overlay">' +
          '<button type="button" class="wa-play-btn">▶</button>' +
        '</div>' +
        (durLabel ? '<span class="wa-video-dur">' + durLabel + '</span>' : '') +
        '<button type="button" class="media-dl-btn" data-url="' + m.media + '" data-name="video.mp4" title="Télécharger">⬇</button>' +
      '</div>';
    if (m.text) content += '<div class="media-caption">' + m.text + '</div>';
  } else if (m.type === 'audio' && m.media) {
    content = '<audio class="media-audio" controls preload="auto" data-mediasrc="1"></audio>';
    if (m.duration) content += '<div class="media-caption">' + Math.round(m.duration) + 's</div>';
  } else if (m.type === 'call') {
    content = '<div class="call-log-msg">' + (m.text || '📞 Appel') + '</div>';
  } else {
    content = '<div>' + (m.text || '') + '</div>';
  }
  // Double coche WhatsApp (messages à moi uniquement, surtout privé)
  let ticks = '';
  if (m.mine && m.type !== 'call') {
    const read = !!(m.readAt || m.read_at);
    ticks = '<span class="msg-ticks' + (read ? ' read' : '') + '" title="' + (read ? 'Lu' : 'Envoyé') + '">' +
      (read ? '✓✓' : '✓✓') + '</span>';
  }
  const meta = '<div class="msg-meta">' + ticks + '</div>';
  const who = m.mine ? '' : '<div class="who">' + (m.author || '') + '</div>';
  return who + content + meta;
}

function bindMediaDownload(container) {
  if (!container) return;
  container.querySelectorAll('.media-dl-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.getAttribute('data-url');
      const name = btn.getAttribute('data-name') || 'media';
      if (!url) return;
      try {
        // fetch + blob pour forcer le téléchargement (sinon ouvre juste l'onglet)
        const res = await fetch(url);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        if (typeof toast === 'function') toast('Téléchargement…');
      } catch (err) {
        // fallback : ouvrir l'URL
        window.open(url, '_blank');
      }
    };
  });
}


function bindMediaSources(container, messages) {
  if (!container || !messages) return;
  const els = container.querySelectorAll('video[data-mediasrc], audio[data-mediasrc]');
  let i = 0;
  messages.forEach(m => {
    if ((m.type !== 'video' && m.type !== 'audio') || !m.media || m.deletedForMe) return;
    const el = els[i++];
    if (!el) return;

    const converted = dataUrlToObjectUrl(m.media);
    // Vider et utiliser <source> avec type (mieux pour Samsung)
    el.removeAttribute('src');
    el.innerHTML = '';
    const source = document.createElement('source');
    source.src = converted.url || m.media;
    source.type = converted.mime || (m.type === 'audio' ? 'audio/webm' : 'video/mp4');
    el.appendChild(source);
    // aussi src direct en secours
    el.src = converted.url || m.media;
    el.removeAttribute('data-mediasrc');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.muted = false;

    el.onerror = () => {
      console.warn('media error, fallback dataurl');
      el.removeAttribute('src');
      el.innerHTML = '';
      el.src = m.media;
      try { el.load(); } catch (e) {}
    };

    try { el.load(); } catch (e) {}

    if (m.type === 'video') {
      const wrap = el.closest('.wa-video');
      if (wrap) {
        const overlay = wrap.querySelector('.wa-video-overlay');
        const btn = wrap.querySelector('.wa-play-btn');

        const showNative = () => {
          // Dernier recours Samsung : contrôles natifs
          el.setAttribute('controls', 'controls');
          if (overlay) overlay.style.display = 'none';
        };

        const toggle = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (el.paused) {
            // Samsung : parfois play() échoue → activer controls
            const p = el.play();
            if (p && typeof p.then === 'function') {
              p.then(() => {
                if (overlay) overlay.classList.add('playing');
                if (btn) btn.textContent = '❚❚';
              }).catch(() => {
                showNative();
                toast('Utilise les boutons du lecteur');
              });
            } else {
              showNative();
            }
          } else {
            el.pause();
            if (overlay) overlay.classList.remove('playing');
            if (btn) btn.textContent = '▶';
          }
        };
        if (overlay) overlay.onclick = toggle;
        if (btn) btn.onclick = toggle;
        el.onended = () => {
          if (overlay) overlay.classList.remove('playing');
          if (btn) btn.textContent = '▶';
        };
      }
    }
  });
}

function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!lb || !img || !src) return;
  img.src = src;
  lb.classList.add('show');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (lb) lb.classList.remove('show');
  if (img) img.src = '';
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

  if (!msgs.length) {
    area.innerHTML = '<div class="empty"><p>Aucun message.</p></div>';
    return;
  }

  msgs.forEach(m => {
    const row = document.createElement('div');
    row.className = 'msg-row ' + (m.mine ? 'mine' : 'other');

    const avSrc = m.mine
      ? (state.user && state.user.avatar ? state.user.avatar : defaultAvatar(state.user ? state.user.firstname : 'U'))
      : (getMemberAvatar(m.author) || defaultAvatar(m.author || '?'));

    const av = document.createElement('img');
    av.className = 'msg-avatar';
    av.src = avSrc;
    av.alt = '';
    av.style.cursor = 'pointer';
    av.onclick = (e) => { e.stopPropagation(); openLightbox(avSrc); };

    const bubble = document.createElement('div');
    bubble.className = 'msg ' + (m.mine ? 'mine' : 'other');
    bubble.innerHTML = buildMsgHtml(m);

    // clic sur image → lightbox
    bubble.querySelectorAll('img.media-img').forEach(img => {
      img.style.cursor = 'pointer';
      img.onclick = (e) => { e.stopPropagation(); openLightbox(img.src); };
    });

    // clic sur le nom → chat privé (groupe)
    if (!m.mine && m.author) {
      const whoEl = bubble.querySelector('.who');
      if (whoEl) {
        whoEl.style.cursor = 'pointer';
        whoEl.style.textDecoration = 'underline';
        whoEl.title = 'Envoyer un message privé';
        whoEl.onclick = (e) => {
          e.stopPropagation();
          const sp = state.spaces.find(s => s.id === state.currentSpaceId);
          const author = (m.author || '').toLowerCase();
          const member = sp && sp.members && sp.members.find(
            x => (x.firstname || '').toLowerCase() === author ||
                 (x.username || '').toLowerCase() === author ||
                 (m.authorId && x.id && String(x.id) === String(m.authorId))
          );
          if (member && typeof openPrivateFromMember === 'function') {
            openPrivateFromMember(member);
          } else if (m.authorId && typeof openPrivateFromMember === 'function') {
            // fallback : on a l'id auteur du message même si pas encore dans la liste locale
            openPrivateFromMember({ id: m.authorId, firstname: m.author, avatar: m.avatar });
          } else {
            toast('Membre introuvable. Va dans Infos pour recharger la liste.');
          }
        };
      }
    }

    row.appendChild(av);
    row.appendChild(bubble);
    area.appendChild(row);
  });

  bindMediaSources(area, msgs);
  bindMediaDownload(area);
  area.scrollTop = area.scrollHeight;
}

async function sendMsg() {
  const input = document.getElementById('message-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !state.currentSpaceId) return;

  const sid = state.currentSpaceId;
  const th = state.currentThread || 'general';

  if (!state.messages[sid]) state.messages[sid] = { general: [], organisation: [], blabla: [] };
  if (!state.messages[sid][th]) state.messages[sid][th] = [];

  // Optimistic UI
  const tempMsg = {
    id: uid(),
    author: state.user.firstname,
    text,
    mine: true,
    type: 'text',
    time: Date.now(),
    avatar: state.user.avatar || '',
    readAt: null
  };

  state.messages[sid][th].push(tempMsg);
  save();
  input.value = '';
  renderMessages();

  // Envoi réel au serveur
  try {
    await sendSpaceMessageApi(sid, {
      text,
      type: 'text',
      thread: th
    });
    // Recharger depuis le serveur pour confirmer le stockage
    if (typeof loadSpaceMessages === 'function') {
      await loadSpaceMessages(sid);
    }
  } catch (err) {
    console.error(err);
    toast(err.message || 'Erreur d\'envoi du message');
  }
}

function pushMediaMsg(target, type, media, text, duration) {
  if (!state.user) {
    toast('Connecte-toi d\'abord');
    return false;
  }
  if (target === 'space' && !state.currentSpaceId) {
    toast('Ouvre un espace d\'abord');
    return false;
  }
  if (target === 'private' && !state.currentPrivateCode) {
    toast('Ouvre un chat privé d\'abord');
    return false;
  }

  const msg = {
    id: uid(),
    author: state.user.firstname || 'Moi',
    text: text || '',
    mine: true,
    type,
    media,
    duration: duration || 0,
    time: Date.now(),
    avatar: state.user.avatar || ''
  };

  try {
    if (target === 'space') {
      const sid = state.currentSpaceId;
      const th = state.currentThread || 'general';
      if (!state.messages[sid]) state.messages[sid] = { general: [], organisation: [], blabla: [] };
      if (!state.messages[sid][th]) state.messages[sid][th] = [];

      state.messages[sid][th].push(msg);
      renderMessages();
      save();

      // Envoi au serveur
      sendSpaceMessageApi(sid, {
        text: text || '',
        type,
        media,
        duration: duration || 0,
        thread: th
      }).catch(err => {
        console.error(err);
        toast('Erreur envoi média');
      });

    } else {
      // Chat privé
      if (!state.privateChats[state.currentPrivateCode]) {
        state.privateChats[state.currentPrivateCode] = {
          otherName: 'Ami',
          messages: [],
          unread: 0,
          online: false,
          updatedAt: Date.now()
        };
      }
      const chat = state.privateChats[state.currentPrivateCode];
      chat.messages.push(msg);
      chat.updatedAt = Date.now();
      renderPrivateMessages();
      save();

      sendPrivateMessageApi(state.currentPrivateCode, {
        text: text || '',
        type,
        media,
        duration: duration || 0
      }).catch(err => {
        console.error(err);
        toast('Erreur envoi média');
      });
    }
    return true;
  } catch (err) {
    console.error('pushMediaMsg', err);
    toast('Erreur envoi média');
    return false;
  }
}

// ========== SYNCHRONISATION API + POLLING (ESPACES) ==========

async function loadSpaceMessages(spaceId) {
  if (!spaceId) return;

  try {
    const data = await getSpaceMessagesApi(spaceId);
    const th = state.currentThread || 'general';

    if (!state.messages[spaceId]) {
      state.messages[spaceId] = { general: [], organisation: [], blabla: [] };
    }

    // Conversion format API → format local
    const converted = (data.messages || []).map(m => ({
      id: m.id,
      author: m.author_name || '',
      authorId: m.author_id || null,
      text: m.content || '',
      mine: m.author_id === (state.user && state.user.id),
      type: m.type || 'text',
      media: m.media_url || null,
      duration: m.duration || 0,
      time: (m.created_at || Date.now() / 1000) * 1000,
      avatar: m.author_avatar || '',
      readAt: m.read_at || null
    }));

    // Remplacer par les messages serveur (source de vérité)
    state.messages[spaceId][th] = converted;

    save();

    if (state.currentSpaceId === spaceId) {
      renderMessages();
    }
  } catch (err) {
    console.error('loadSpaceMessages', err);
  }
}

let spacePollInterval = null;

function startSpacePolling(spaceId) {
  stopSpacePolling();
  spacePollInterval = setInterval(() => {
    if (state.currentSpaceId === spaceId) {
      loadSpaceMessages(spaceId);
    }
  }, 2500); // toutes les 2,5 secondes
}

function stopSpacePolling() {
  if (spacePollInterval) {
    clearInterval(spacePollInterval);
    spacePollInterval = null;
  }
}

// À appeler quand on ouvre un espace
function openSpaceChat(spaceId, thread = 'general') {
  state.currentSpaceId = spaceId;
  state.currentThread = thread;

  loadSpaceMessages(spaceId);
  startSpacePolling(spaceId);

  renderMessages();
  // show('screen-space-chat') ou le nom de ton écran
}

// À appeler quand on quitte un espace
function closeSpaceChat() {
  stopSpacePolling();
  state.currentSpaceId = null;
}
