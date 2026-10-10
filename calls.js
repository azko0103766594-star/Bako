/* calls.js – UI d appel (placeholder) */

// ========== CALL UI (placeholder – real calls need Cloudflare Realtime) ==========
let callTimerInterval = null;
let callStartTime = 0;
let callMuted = false;
let callCamOff = false;
let currentCallType = null; // 'audio' | 'video'

function startCallUI(context, type) {
  currentCallType = type;
  callMuted = false;
  callCamOff = false;

  const screen = document.getElementById('call-screen');
  const nameEl = document.getElementById('call-name');
  const statusEl = document.getElementById('call-status');
  const avatarEl = document.getElementById('call-avatar');
  const camBtn = document.getElementById('btn-call-cam');
  const muteBtn = document.getElementById('btn-call-mute');

  // Name & avatar
  if (context === 'space') {
    const sp = state.spaces.find(s => s.id === state.currentSpaceId);
    nameEl.textContent = sp ? sp.name : 'Espace';
    avatarEl.innerHTML = sp ? initial(sp.name) : 'A';
  } else {
    const chat = state.privateChats[state.currentPrivateCode];
    nameEl.textContent = chat ? (chat.otherName || 'Ami') : 'Chat privé';
    if (chat && chat.otherAvatar) {
      avatarEl.innerHTML = '<img src="' + chat.otherAvatar + '" alt="">';
    } else {
      avatarEl.innerHTML = chat ? initial(chat.otherName || 'A') : 'A';
    }
  }

  statusEl.textContent = type === 'video' ? 'Appel vidéo...' : 'Appel audio...';
  document.getElementById('call-timer').textContent = '00:00';

  // Show/hide camera button
  camBtn.style.display = type === 'video' ? 'flex' : 'none';
  camBtn.classList.remove('off');
  muteBtn.classList.remove('active');

  screen.classList.add('active');

  // Fake timer
  callStartTime = Date.now();
  clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    const sec = Math.floor((Date.now() - callStartTime) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    document.getElementById('call-timer').textContent = m + ':' + s;
  }, 1000);

  // Try to get local media just for UI feedback (optional)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const constraints = type === 'video'
      ? { audio: true, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } }
      : { audio: true };
    navigator.mediaDevices.getUserMedia(constraints).catch(() => {
      // Permission denied or not available – UI still works
    });
  }

  toast(type === 'video' ? 'Appel vidéo (interface)' : 'Appel audio (interface)');
}

function endCallUI() {
  clearInterval(callTimerInterval);
  document.getElementById('call-screen').classList.remove('active');
  currentCallType = null;
  // Stop any local tracks if they were started
  // (we don't keep the stream reference for simplicity in this placeholder)
  toast('Appel terminé');
}

function toggleMuteUI() {
  callMuted = !callMuted;
  const btn = document.getElementById('btn-call-mute');
  btn.classList.toggle('active', callMuted);
  btn.textContent = callMuted ? '🔈' : '🔇';
  toast(callMuted ? 'Micro coupé' : 'Micro activé');
}

function toggleCamUI() {
  if (currentCallType !== 'video') return;
  callCamOff = !callCamOff;
  const btn = document.getElementById('btn-call-cam');
  btn.classList.toggle('off', callCamOff);
  btn.textContent = callCamOff ? '🚫' : '📷';
  toast(callCamOff ? 'Caméra coupée' : 'Caméra activée');
}

