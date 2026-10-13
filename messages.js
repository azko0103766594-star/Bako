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
    const dur = m.duration ? Math.round(m.duration) : 0;
    const durStr = dur ? (Math.floor(dur / 60) + ':' + String(dur % 60).padStart(2, '0')) : '0:00';
    content =
      '<div class="wa-audio media-wrap" data-audiourl="' + m.media + '" data-duration="' + dur + '">' +
        '<button type="button" class="wa-audio-play" aria-label="Lire">▶</button>' +
        '<div class="wa-audio-wave">' +
          '<div class="wa-audio-progress"></div>' +
        '</div>' +
        '<span class="wa-audio-time">' + durStr + '</span>' +
        '<button type="button" class="media-dl-btn" data-url="' + m.media + '" data-name="vocal.webm" title="Télécharger">⬇</button>' +
      '</div>';
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


function guessMediaMime(url, msgType) {
  const u = (url || '').toLowerCase();
  if (msgType === 'audio') {
    if (u.includes('.mp3') || u.includes('/mp3') || u.includes('f_mp3')) return 'audio/mpeg';
    if (u.includes('.ogg') || u.includes('f_ogg')) return 'audio/ogg';
    if (u.includes('.m4a') || u.includes('.aac') || u.includes('f_aac')) return 'audio/mp4';
    if (u.includes('.wav')) return 'audio/wav';
    if (u.includes('.webm') || u.includes('.opus')) return 'audio/webm';
    return 'audio/webm';
  }
  if (u.includes('.webm') || u.includes('f_webm')) return 'video/webm';
  if (u.includes('.ogg') || u.includes('f_ogg')) return 'video/ogg';
  return 'video/mp4';
}

/** Force un format jouable (Cloudinary + anciens messages webm) */
function ensurePlayableMediaUrl(url, msgType) {
  if (!url || typeof url !== 'string') return url;
  if (typeof makePlayableCloudinaryUrl === 'function' && url.includes('res.cloudinary.com')) {
    return makePlayableCloudinaryUrl(url, msgType === 'audio' ? 'audio' : 'video');
  }
  return url;
}

/** Android/Samsung : force le MIME correct via blob (contourne Content-Type serveur faux) */
async function forceBlobSrc(el, url, mime) {
  try {
    // Essayer CORS d’abord, puis no-cors fallback impossible pour blob → on reste en cors
    const res = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'force-cache' });
    if (!res.ok) throw new Error('fetch ' + res.status);
    let blob = await res.blob();
    // Si le serveur a renvoyé un type bizarre, on force le nôtre
    const finalType = mime || (blob.type && blob.type !== 'application/octet-stream' ? blob.type : 'audio/webm');
    if (blob.type !== finalType) {
      blob = new Blob([blob], { type: finalType });
    }
    const objUrl = URL.createObjectURL(blob);
    el.removeAttribute('src');
    el.innerHTML = '';
    // Pas de <source> : juste src direct (plus fiable sur Samsung)
    el.src = objUrl;
    el.load();
    el._blobUrl = objUrl;
    // Cleanup après 5 min pour éviter memory leak
    setTimeout(() => {
      try { URL.revokeObjectURL(objUrl); } catch (e) {}
    }, 5 * 60 * 1000);
    return true;
  } catch (e) {
    console.warn('forceBlobSrc fail', url, e);
    return false;
  }
}

function isMobileAndroid() {
  const ua = navigator.userAgent || '';
  // Samsung Internet + Chrome Android + tout mobile Android (le problème MIME/blob est très courant)
  return /Android/i.test(ua) || /SamsungBrowser/i.test(ua) || (/Mobile/i.test(ua) && /Linux/i.test(ua));
}

// Lecteur vocal custom – essais multiples (mp3 Cloudinary → webm → blob)
let currentAudio = null;
let currentAudioBtn = null;
let currentProgressTimer = null;

function stopCurrentAudio() {
  if (currentProgressTimer) {
    clearInterval(currentProgressTimer);
    currentProgressTimer = null;
  }
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
    currentAudio = null;
  }
  if (currentAudioBtn) {
    currentAudioBtn.textContent = '▶';
    currentAudioBtn.classList.remove('playing');
    const wrap = currentAudioBtn.closest('.wa-audio');
    if (wrap) {
      const prog = wrap.querySelector('.wa-audio-progress');
      if (prog) prog.style.width = '0%';
    }
    currentAudioBtn = null;
  }
}

/** Liste d’URLs à essayer (mp3 Cloudinary en premier = le plus compatible Samsung) */
function getAudioCandidates(rawUrl) {
  const list = [];
  if (!rawUrl) return list;
  if (rawUrl.includes('res.cloudinary.com')) {
    let mp3 = rawUrl;
    if (!mp3.includes('f_mp3')) {
      mp3 = mp3.replace(/\/upload\/(?:v\d+\/)?/, '/upload/f_mp3/');
    }
    mp3 = mp3.replace(/\.(webm|ogg|opus|wav|m4a|aac|mp4)(\?.*)?$/i, '.mp3$2');
    if (!/\.mp3(\?|$)/i.test(mp3)) mp3 = mp3.replace(/(\?|$)/, '.mp3$1');
    list.push(mp3);
  }
  list.push(rawUrl);
  return list;
}

function bindAudioPlayers(container) {
  if (!container) return;
  container.querySelectorAll('.wa-audio').forEach(wrap => {
    const btn = wrap.querySelector('.wa-audio-play');
    const prog = wrap.querySelector('.wa-audio-progress');
    const timeEl = wrap.querySelector('.wa-audio-time');
    const rawUrl = wrap.getAttribute('data-audiourl');
    if (!btn || !rawUrl) return;

    let audioObj = null;

    const updateTime = () => {
      if (!audioObj || !timeEl) return;
      const cur = Math.floor(audioObj.currentTime || 0);
      const dur = Math.floor(audioObj.duration || parseFloat(wrap.getAttribute('data-duration')) || 0);
      const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      timeEl.textContent = fmt(cur) + (dur ? ' / ' + fmt(dur) : '');
      if (prog && dur > 0) prog.style.width = Math.min(100, (cur / dur) * 100) + '%';
    };

    const tryPlayUrl = (url) => new Promise((resolve, reject) => {
      const a = new Audio();
      a.preload = 'auto';
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        if (ok) resolve(a);
        else reject(new Error('cannot play'));
      };
      a.oncanplaythrough = () => finish(true);
      a.oncanplay = () => finish(true);
      a.onerror = () => finish(false);
      setTimeout(() => {
        if (!settled) finish(a.readyState >= 2);
      }, 3500);
      a.src = url;
      a.load();
    });

    const tryBlob = async (url, mime) => {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'force-cache' });
      if (!res.ok) throw new Error('fetch ' + res.status);
      const blob = await res.blob();
      const typed = new Blob([blob], { type: mime });
      const obj = URL.createObjectURL(typed);
      return tryPlayUrl(obj);
    };

    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (currentAudio && currentAudioBtn === btn && !currentAudio.paused) {
        currentAudio.pause();
        btn.textContent = '▶';
        btn.classList.remove('playing');
        if (currentProgressTimer) clearInterval(currentProgressTimer);
        return;
      }

      stopCurrentAudio();
      btn.textContent = '…';
      btn.disabled = true;

      const candidates = getAudioCandidates(rawUrl);
      let played = false;

      // 1) URLs directes (mp3 Cloudinary en premier)
      for (const url of candidates) {
        try {
          console.log('[vocal] try', url.substring(0, 80));
          audioObj = await tryPlayUrl(url);
          await audioObj.play();
          played = true;
          break;
        } catch (err) {
          console.warn('[vocal] fail url', err && err.message);
        }
      }

      // 2) Blob avec différents MIME
      if (!played) {
        for (const mime of ['audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/mp4']) {
          try {
            console.log('[vocal] try blob', mime);
            audioObj = await tryBlob(rawUrl, mime);
            await audioObj.play();
            played = true;
            break;
          } catch (err) {
            console.warn('[vocal] blob fail', mime);
          }
        }
      }

      // 3) Dernier recours Samsung : jouer via un <video> caché (parfois webm marche mieux)
      if (!played) {
        try {
          console.log('[vocal] try hidden video');
          const v = document.createElement('video');
          v.playsInline = true;
          v.setAttribute('playsinline', '');
          v.preload = 'auto';
          v.src = rawUrl;
          v.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;';
          document.body.appendChild(v);
          await new Promise((res, rej) => {
            v.oncanplay = () => res();
            v.onerror = () => rej(new Error('video fail'));
            setTimeout(() => (v.readyState >= 2 ? res() : rej(new Error('timeout'))), 4000);
            v.load();
          });
          await v.play();
          audioObj = v; // on le traite comme audio
          played = true;
          v.onended = () => {
            stopCurrentAudio();
            try { v.remove(); } catch (e) {}
          };
        } catch (err) {
          console.warn('[vocal] video fallback fail', err);
        }
      }

      btn.disabled = false;

      if (played && audioObj) {
        currentAudio = audioObj;
        currentAudioBtn = btn;
        btn.textContent = '❚❚';
        btn.classList.add('playing');
        audioObj.onended = () => stopCurrentAudio();
        audioObj.ontimeupdate = updateTime;
        currentProgressTimer = setInterval(updateTime, 250);
        updateTime();
      } else {
        btn.textContent = '▶';
        if (typeof toast === 'function') toast('Lecture impossible – appuie sur ⬇');
        try { window.open(rawUrl, '_blank'); } catch (e) {}
      }
    };
  });
}

function bindMediaSources(container, messages) {
  if (!container || !messages) return;
  const mobileAndroid = isMobileAndroid();

  // ===== VOCAL (lecteur custom) =====
  bindAudioPlayers(container);

  // ===== VIDÉO (robuste Samsung) =====
  const els = container.querySelectorAll('video[data-mediasrc]');
  let i = 0;

  messages.forEach(m => {
    if (m.type !== 'video' || !m.media || m.deletedForMe) return;
    const el = els[i++];
    if (!el) return;

    const isHttp = /^https?:\/\//i.test(m.media);
    let srcUrl = ensurePlayableMediaUrl(m.media, 'video');
    let mime = guessMediaMime(srcUrl, 'video');

    if (!isHttp && m.media.startsWith('data:')) {
      const converted = dataUrlToObjectUrl(m.media);
      srcUrl = converted.url || m.media;
      mime = converted.mime || mime;
    }

    // Toujours contrôles natifs + pas d’overlay sur Android/Samsung
    const wrap = el.closest('.wa-video');
    if (wrap) {
      const overlay = wrap.querySelector('.wa-video-overlay');
      if (overlay) overlay.style.display = 'none';
    }

    el.removeAttribute('src');
    el.innerHTML = '';
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.setAttribute('x5-playsinline', '');
    el.setAttribute('x5-video-player-type', 'h5');
    el.setAttribute('controls', 'controls');
    el.controls = true;
    el.muted = false;
    el.preload = 'auto';
    el.style.pointerEvents = 'auto';
    if (srcUrl.includes('res.cloudinary.com')) el.crossOrigin = 'anonymous';

    // Liste de candidates (mp4 Cloudinary en premier)
    const candidates = [];
    if (srcUrl.includes('res.cloudinary.com') && !srcUrl.includes('f_mp4')) {
      candidates.push(ensurePlayableMediaUrl(m.media, 'video'));
    }
    candidates.push(srcUrl);
    if (m.media !== srcUrl) candidates.push(m.media);

    const trySetSrc = (url, type) => {
      el.removeAttribute('src');
      el.innerHTML = '';
      const source = document.createElement('source');
      source.src = url;
      if (type) source.type = type;
      el.appendChild(source);
      el.src = url;
      try { el.load(); } catch (e) {}
    };

    // 1) Essayer d’abord l’URL mp4 / originale
    trySetSrc(candidates[0], mime || 'video/mp4');

    el.onerror = async () => {
      console.warn('[video] error', el.src);
      // 2) Essayer les autres URLs
      for (let c = 1; c < candidates.length; c++) {
        trySetSrc(candidates[c], 'video/mp4');
        await new Promise(r => setTimeout(r, 300));
        if (!el.error) return;
      }
      // 3) Force blob avec différents MIME (le fichier est bon puisqu’il se lit après téléchargement)
      const mimes = ['video/mp4', 'video/webm', 'video/quicktime', ''];
      for (const mm of mimes) {
        const ok = await forceBlobSrc(el, m.media, mm || 'video/mp4');
        if (ok) {
          el.setAttribute('controls', 'controls');
          return;
        }
      }
      console.warn('[video] all attempts failed');
    };

    // Sur Android on force le blob dès le départ (MIME serveur souvent faux)
    if (mobileAndroid && isHttp) {
      forceBlobSrc(el, m.media, 'video/mp4').then(ok => {
        if (!ok) {
          // réessayer webm
          forceBlobSrc(el, m.media, 'video/webm').then(ok2 => {
            if (!ok2) trySetSrc(srcUrl, mime);
          });
        }
        el.setAttribute('controls', 'controls');
        el.controls = true;
      });
    }

    el.removeAttribute('data-mediasrc');
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

    if (!state.messages[spaceId]) {
      state.messages[spaceId] = { general: [], organisation: [], blabla: [] };
    }

    // Répartir les messages dans les 3 fils (Général / Organisation / Blabla)
    const buckets = { general: [], organisation: [], blabla: [] };

    (data.messages || []).forEach(m => {
      const th = (m.thread || 'general').toLowerCase();
      const key = (th === 'organisation' || th === 'blabla') ? th : 'general';
      buckets[key].push({
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
        readAt: m.read_at || null,
        thread: key
      });
    });

    state.messages[spaceId].general = buckets.general;
    state.messages[spaceId].organisation = buckets.organisation;
    state.messages[spaceId].blabla = buckets.blabla;

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
