/* messages.js – Messages d espace (rendu, envoi, medias) */

function buildMsgHtml(m) {
  let content = '';
  if (m.type === 'image' && m.media) {
    content = '<img class="media-img" src="' + m.media + '" alt="image">';
    if (m.text) content += '<div class="media-caption">' + m.text + '</div>';
  } else if (m.type === 'video' && m.media) {
    // Style WhatsApp : bulle + play au centre
    const durLabel = m.duration ? Math.round(m.duration) + 's' : '';
    content =
      '<div class="wa-video">' +
        '<video class="media-video" playsinline webkit-playsinline preload="metadata" data-mediasrc="1"></video>' +
        '<div class="wa-video-overlay">' +
          '<button type="button" class="wa-play-btn">▶</button>' +
        '</div>' +
        (durLabel ? '<span class="wa-video-dur">' + durLabel + '</span>' : '') +
      '</div>';
    if (m.text) content += '<div class="media-caption">' + m.text + '</div>';
  } else if (m.type === 'audio' && m.media) {
    content = '<audio class="media-audio" controls preload="auto" data-mediasrc="1"></audio>';
    if (m.duration) content += '<div class="media-caption">' + Math.round(m.duration) + 's</div>';
  } else {
    content = '<div>' + (m.text || '') + '</div>';
  }
  const who = m.mine ? '' : '<div class="who">' + (m.author || '') + '</div>';
  return who + content;
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
  if (!msgs.length) { area.innerHTML = '<div class="empty"><p>Aucun message.</p></div>'; return; }
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
    row.appendChild(av);
    row.appendChild(bubble);
    area.appendChild(row);
  });
  bindMediaSources(area, msgs);
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
    author: state.user.firstname,
    text,
    mine: true,
    type: 'text',
    avatar: state.user.avatar || ''
  });
  save();
  input.value = '';
  renderMessages();
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
      renderMessages(); // afficher d'abord
      save();
    } else {
      if (!state.privateChats[state.currentPrivateCode]) {
        state.privateChats[state.currentPrivateCode] = {
          otherName: 'Ami', messages: [], unread: 0, online: false, updatedAt: Date.now()
        };
      }
      const chat = state.privateChats[state.currentPrivateCode];
      chat.messages.push(msg);
      chat.updatedAt = Date.now();
      renderPrivateMessages();
      save();
    }
    return true;
  } catch (err) {
    console.error('pushMediaMsg', err);
    toast('Erreur envoi média');
    return false;
  }
}

