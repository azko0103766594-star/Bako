/* calls.js – Appels audio / vidéo WebRTC (1:1 privé + espace) */

const ICE_SERVERS = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
];

let callTimerInterval = null;
let callStartTime = 0;
let callMuted = false;
let callCamOff = false;
let currentCallType = null; // 'audio' | 'video'
let currentCallId = null;
let currentCallContext = null; // 'private' | 'space'
let currentPeerId = null; // other user id
let isCaller = false;

let pc = null; // RTCPeerConnection
let localStream = null;
let remoteStream = null;
let callPollTimer = null;
let lastSignalId = 0;
let pendingIncoming = null;

// ========== UI ==========
function startCallUI(context, type, opts = {}) {
  currentCallType = type;
  currentCallContext = context;
  callMuted = false;
  callCamOff = false;

  const screen = document.getElementById("call-screen");
  const nameEl = document.getElementById("call-name");
  const statusEl = document.getElementById("call-status");
  const avatarEl = document.getElementById("call-avatar");
  const camBtn = document.getElementById("btn-call-cam");
  const muteBtn = document.getElementById("btn-call-mute");
  const localVideo = document.getElementById("call-local-video");
  const remoteVideo = document.getElementById("call-remote-video");
  const note = document.getElementById("call-note");

  if (context === "space") {
    const sp = state.spaces.find((s) => s.id === state.currentSpaceId);
    nameEl.textContent = sp ? sp.name : "Espace";
    avatarEl.innerHTML = sp ? initial(sp.name) : "A";
  } else {
    const chat = state.privateChats[state.currentPrivateCode];
    nameEl.textContent = chat ? chat.otherName || "Ami" : "Chat privé";
    if (chat && chat.otherAvatar) {
      avatarEl.innerHTML = '<img src="' + chat.otherAvatar + '" alt="">';
    } else {
      avatarEl.innerHTML = chat ? initial(chat.otherName || "A") : "A";
    }
  }

  statusEl.textContent = opts.incoming
    ? "Appel entrant..."
    : type === "video"
      ? "Appel vidéo..."
      : "Appel audio...";
  document.getElementById("call-timer").textContent = "00:00";

  camBtn.style.display = type === "video" ? "flex" : "none";
  camBtn.classList.remove("off");
  muteBtn.classList.remove("active");
  muteBtn.textContent = "🔇";

  if (localVideo) {
    localVideo.style.display = type === "video" ? "block" : "none";
    localVideo.srcObject = null;
  }
  if (remoteVideo) {
    remoteVideo.style.display = type === "video" ? "block" : "none";
    remoteVideo.srcObject = null;
  }
  if (avatarEl) avatarEl.style.display = type === "video" ? "none" : "flex";
  if (note) note.style.display = "none";

  // Incoming accept/reject buttons
  const incomingActions = document.getElementById("call-incoming-actions");
  const activeControls = document.getElementById("call-controls");
  if (opts.incoming) {
    if (incomingActions) incomingActions.style.display = "flex";
    if (activeControls) activeControls.style.display = "none";
  } else {
    if (incomingActions) incomingActions.style.display = "none";
    if (activeControls) activeControls.style.display = "flex";
  }

  screen.classList.add("active");
}

function setCallStatus(text) {
  const el = document.getElementById("call-status");
  if (el) el.textContent = text;
}

function startCallTimer() {
  callStartTime = Date.now();
  clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    const sec = Math.floor((Date.now() - callStartTime) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    const t = document.getElementById("call-timer");
    if (t) t.textContent = m + ":" + s;
  }, 1000);
}

function stopCallTimer() {
  clearInterval(callTimerInterval);
  callTimerInterval = null;
}

// ========== MEDIA ==========
async function getLocalMedia(type) {
  const constraints =
    type === "video"
      ? {
          audio: true,
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        }
      : { audio: true, video: false };

  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  const localVideo = document.getElementById("call-local-video");
  if (localVideo && type === "video") {
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    localVideo.play().catch(() => {});
  }
  return localStream;
}

function stopLocalMedia() {
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  const localVideo = document.getElementById("call-local-video");
  if (localVideo) localVideo.srcObject = null;
  const remoteVideo = document.getElementById("call-remote-video");
  if (remoteVideo) remoteVideo.srcObject = null;
}

// ========== WEBRTC ==========
function createPeerConnection() {
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (ev) => {
    if (ev.candidate && currentCallId && currentPeerId) {
      sendCallSignalApi(currentCallId, currentPeerId, "ice", {
        candidate: ev.candidate,
      }).catch((e) => console.warn("ice send", e));
    }
  };

  pc.ontrack = (ev) => {
    if (!remoteStream) remoteStream = new MediaStream();
    remoteStream.addTrack(ev.track);
    const remoteVideo = document.getElementById("call-remote-video");
    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play().catch(() => {});
    }
    // For audio-only, ensure we still hear
    if (currentCallType === "audio") {
      // attach to a hidden audio element if needed
      let audioEl = document.getElementById("call-remote-audio");
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.id = "call-remote-audio";
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
      }
      audioEl.srcObject = remoteStream;
    }
    setCallStatus("Connecté");
  };

  pc.onconnectionstatechange = () => {
    if (!pc) return;
    const st = pc.connectionState;
    if (st === "connected") {
      setCallStatus("Connecté");
      startCallTimer();
    } else if (st === "failed" || st === "disconnected") {
      setCallStatus("Connexion perdue...");
    } else if (st === "closed") {
      // ignore
    }
  };

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  return pc;
}

async function createAndSendOffer() {
  if (!pc || !currentCallId || !currentPeerId) return;
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await sendCallSignalApi(currentCallId, currentPeerId, "offer", {
    sdp: pc.localDescription,
  });
}

async function handleRemoteOffer(sdp) {
  if (!pc) createPeerConnection();
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await sendCallSignalApi(currentCallId, currentPeerId, "answer", {
    sdp: pc.localDescription,
  });
}

async function handleRemoteAnswer(sdp) {
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

async function handleRemoteIce(candidate) {
  if (!pc || !candidate) return;
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.warn("addIceCandidate", e);
  }
}

async function processSignal(sig) {
  if (!sig || sig.call_id !== currentCallId) return;
  const payload =
    typeof sig.payload === "string" ? JSON.parse(sig.payload) : sig.payload;

  if (sig.kind === "offer") {
    currentPeerId = sig.from_user;
    await handleRemoteOffer(payload.sdp);
  } else if (sig.kind === "answer") {
    await handleRemoteAnswer(payload.sdp);
  } else if (sig.kind === "ice") {
    await handleRemoteIce(payload.candidate);
  }
}

// ========== CALL FLOW ==========
async function startOutgoingCall(context, type) {
  if (!state.user) {
    toast("Connecte-toi d'abord");
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("Ton navigateur ne supporte pas les appels");
    return;
  }

  try {
    isCaller = true;
    startCallUI(context, type, { incoming: false });
    setCallStatus("Connexion micro/caméra...");

    await getLocalMedia(type);

    const payload = { type, context };
    if (context === "private") {
      payload.privateCode = state.currentPrivateCode;
    } else {
      payload.spaceId = state.currentSpaceId;
      // Pour l'instant : appel de groupe "ringing" sans callee précis
      // (le premier qui répond devient le peer 1:1)
    }

    const res = await startCallApi(payload);
    currentCallId = res.callId;
    currentPeerId = res.calleeId || null;

    setCallStatus("Sonnerie...");
    createPeerConnection();

    // Si on a déjà le callee (privé), on attend qu'il réponde puis on envoie l'offer
    // L'offer est envoyé quand le callee a répondu (status active) – via poll
    startCallPolling();
  } catch (e) {
    console.error(e);
    toast(e.message || "Impossible de démarrer l'appel");
    cleanupCall();
  }
}

async function acceptIncomingCall() {
  if (!pendingIncoming) return;
  const call = pendingIncoming;
  pendingIncoming = null;

  try {
    isCaller = false;
    currentCallId = call.id;
    currentCallType = call.type;
    currentCallContext = call.context;
    currentPeerId = call.caller_id;

    // Switch UI to active controls
    startCallUI(call.context, call.type, { incoming: false });
    setCallStatus("Connexion...");

    await getLocalMedia(call.type);
    createPeerConnection();

    await answerCallApi(call.id);
    setCallStatus("En attente du flux...");
    startCallPolling();
  } catch (e) {
    console.error(e);
    toast(e.message || "Impossible de répondre");
    cleanupCall();
  }
}

async function rejectIncomingCall() {
  if (!pendingIncoming) return;
  const call = pendingIncoming;
  pendingIncoming = null;
  try {
    await rejectCallApi(call.id);
  } catch (e) {}
  document.getElementById("call-screen").classList.remove("active");
  toast("Appel refusé");
}

async function hangupCall() {
  try {
    if (currentCallId) {
      await endCallApi(currentCallId).catch(() => {});
    }
  } finally {
    cleanupCall();
    toast("Appel terminé");
  }
}

function cleanupCall() {
  stopCallTimer();
  stopLocalMedia();
  if (pc) {
    try {
      pc.close();
    } catch (e) {}
    pc = null;
  }
  remoteStream = null;
  currentCallId = null;
  currentPeerId = null;
  currentCallType = null;
  isCaller = false;
  pendingIncoming = null;

  const screen = document.getElementById("call-screen");
  if (screen) screen.classList.remove("active");

  const audioEl = document.getElementById("call-remote-audio");
  if (audioEl) {
    audioEl.srcObject = null;
    audioEl.remove();
  }
}

function toggleMuteUI() {
  callMuted = !callMuted;
  if (localStream) {
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !callMuted;
    });
  }
  const btn = document.getElementById("btn-call-mute");
  if (btn) {
    btn.classList.toggle("active", callMuted);
    btn.textContent = callMuted ? "🔈" : "🔇";
  }
  toast(callMuted ? "Micro coupé" : "Micro activé");
}

function toggleCamUI() {
  if (currentCallType !== "video") return;
  callCamOff = !callCamOff;
  if (localStream) {
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !callCamOff;
    });
  }
  const btn = document.getElementById("btn-call-cam");
  if (btn) {
    btn.classList.toggle("off", callCamOff);
    btn.textContent = callCamOff ? "🚫" : "📷";
  }
  toast(callCamOff ? "Caméra coupée" : "Caméra activée");
}

// Compat avec bind.js existant
function startCallUI_compat(context, type) {
  startOutgoingCall(context, type);
}
// Alias : bind.js appelle startCallUI / endCallUI
async function endCallUI() {
  await hangupCall();
}

// ========== POLLING ==========
function startCallPolling() {
  stopCallPolling();
  callPollTimer = setInterval(pollCalls, 1500);
  pollCalls();
}

function stopCallPolling() {
  if (callPollTimer) {
    clearInterval(callPollTimer);
    callPollTimer = null;
  }
}

async function pollCalls() {
  if (!state.user || !getToken()) return;
  try {
    const data = await pollCallsApi(lastSignalId);

    // Signaux WebRTC
    if (data.signals && data.signals.length) {
      for (const sig of data.signals) {
        if (sig.id > lastSignalId) lastSignalId = sig.id;
        await processSignal(sig);
      }
    }

    // Appel entrant
    if (data.incoming && data.incoming.length && !currentCallId && !pendingIncoming) {
      const call = data.incoming[0];
      pendingIncoming = call;
      showIncomingCall(call);
    }

    // Si je suis l'appelant et l'appel est passé en active → envoyer l'offer
    if (isCaller && currentCallId && pc && currentPeerId) {
      const mine = (data.myCalls || []).find((c) => c.id === currentCallId);
      if (mine && mine.status === "active" && !pc.localDescription) {
        setCallStatus("Établissement de la connexion...");
        await createAndSendOffer();
      }
      // Si le peer a rejeté / terminé
      if (mine && (mine.status === "ended" || mine.status === "rejected")) {
        toast(mine.status === "rejected" ? "Appel refusé" : "Appel terminé");
        cleanupCall();
        stopCallPolling();
      }
    }

    // Callee : si l'appelant a raccroché
    if (!isCaller && currentCallId) {
      const mine = (data.myCalls || []).find((c) => c.id === currentCallId);
      if (mine && (mine.status === "ended" || mine.status === "rejected")) {
        toast("Appel terminé");
        cleanupCall();
        stopCallPolling();
      }
      // Si myCalls ne contient plus l'appel actif
      if (!mine && currentCallId) {
        // peut être encore ringing côté nous — ignore
      }
    }

    // Si pendingIncoming a expiré
    if (pendingIncoming) {
      const still = (data.incoming || []).find((c) => c.id === pendingIncoming.id);
      const mine = (data.myCalls || []).find((c) => c.id === pendingIncoming.id);
      if (!still && (!mine || mine.status !== "ringing")) {
        pendingIncoming = null;
        document.getElementById("call-screen").classList.remove("active");
        toast("Appel manqué");
      }
    }
  } catch (e) {
    // silencieux (réseau)
  }
}

function showIncomingCall(call) {
  const name =
    call.caller_name ||
    (call.context === "space" ? "Espace" : "Appel entrant");
  startCallUI(call.context, call.type, { incoming: true });

  const nameEl = document.getElementById("call-name");
  if (nameEl) nameEl.textContent = name;
  if (call.caller_avatar) {
    const avatarEl = document.getElementById("call-avatar");
    if (avatarEl) avatarEl.innerHTML = '<img src="' + call.caller_avatar + '" alt="">';
  }
  setCallStatus(call.type === "video" ? "Appel vidéo entrant..." : "Appel audio entrant...");
}

// Démarrer le poll global dès qu'on est connecté (pour recevoir les appels)
function ensureCallPolling() {
  if (!callPollTimer && state.user) {
    startCallPolling();
  }
}

// Hook : appelé après login réussi (depuis bind / actions)
window.alignStartCallPolling = ensureCallPolling;

// Redéfinir startCallUI pour bind.js
window.startCallUI = function (context, type) {
  startOutgoingCall(context, type);
};
window.endCallUI = hangupCall;
window.toggleMuteUI = toggleMuteUI;
window.toggleCamUI = toggleCamUI;
window.acceptIncomingCall = acceptIncomingCall;
window.rejectIncomingCall = rejectIncomingCall;
