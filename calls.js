/* calls.js – Appels audio / vidéo WebRTC (1:1 privé + espace) */

const ICE_SERVERS = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
];

let callTimerInterval = null;
let callStartTime = 0;
let callMuted = false;
let callCamOff = false;
let currentCallType = null;
let currentCallId = null;
let currentCallContext = null;
let currentPeerId = null;
let isCaller = false;

let pc = null;
let localStream = null;
let remoteStream = null;
let callPollTimer = null;
let lastSignalId = 0;
let pendingIncoming = null;
let offerSent = false;

/** Affiche uniquement l'UI d'appel (ne démarre PAS l'appel) */
function showCallScreen(context, type, opts) {
  opts = opts || {};
  currentCallType = type;
  currentCallContext = context;
  callMuted = false;
  callCamOff = false;

  var screen = document.getElementById("call-screen");
  var nameEl = document.getElementById("call-name");
  var statusEl = document.getElementById("call-status");
  var avatarEl = document.getElementById("call-avatar");
  var camBtn = document.getElementById("btn-call-cam");
  var muteBtn = document.getElementById("btn-call-mute");
  var localVideo = document.getElementById("call-local-video");
  var remoteVideo = document.getElementById("call-remote-video");
  var note = document.getElementById("call-note");

  if (context === "space") {
    var sp = state.spaces.find(function (s) { return s.id === state.currentSpaceId; });
    nameEl.textContent = sp ? sp.name : "Espace";
    avatarEl.innerHTML = sp ? initial(sp.name) : "A";
  } else {
    var chat = state.privateChats[state.currentPrivateCode];
    nameEl.textContent = chat ? (chat.otherName || "Ami") : "Chat privé";
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

  if (camBtn) {
    camBtn.style.display = type === "video" ? "flex" : "none";
    camBtn.classList.remove("off");
    camBtn.textContent = "📷";
  }
  if (muteBtn) {
    muteBtn.classList.remove("active");
    muteBtn.textContent = "🔇";
  }

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

  var incomingActions = document.getElementById("call-incoming-actions");
  var activeControls = document.getElementById("call-controls");
  if (opts.incoming) {
    if (incomingActions) incomingActions.style.display = "flex";
    if (activeControls) activeControls.style.display = "none";
  } else {
    if (incomingActions) incomingActions.style.display = "none";
    if (activeControls) activeControls.style.display = "flex";
  }

  if (screen) screen.classList.add("active");
}

function setCallStatus(text) {
  var el = document.getElementById("call-status");
  if (el) el.textContent = text;
}

function startCallTimer() {
  callStartTime = Date.now();
  clearInterval(callTimerInterval);
  callTimerInterval = setInterval(function () {
    var sec = Math.floor((Date.now() - callStartTime) / 1000);
    var m = String(Math.floor(sec / 60)).padStart(2, "0");
    var s = String(sec % 60).padStart(2, "0");
    var t = document.getElementById("call-timer");
    if (t) t.textContent = m + ":" + s;
  }, 1000);
}

function stopCallTimer() {
  clearInterval(callTimerInterval);
  callTimerInterval = null;
}

async function getLocalMedia(type) {
  var constraints =
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
  var localVideo = document.getElementById("call-local-video");
  if (localVideo && type === "video") {
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    localVideo.play().catch(function () {});
  }
  return localStream;
}

function stopLocalMedia() {
  if (localStream) {
    localStream.getTracks().forEach(function (t) { t.stop(); });
    localStream = null;
  }
  var localVideo = document.getElementById("call-local-video");
  if (localVideo) localVideo.srcObject = null;
  var remoteVideo = document.getElementById("call-remote-video");
  if (remoteVideo) remoteVideo.srcObject = null;
}

function createPeerConnection() {
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = function (ev) {
    if (ev.candidate && currentCallId && currentPeerId) {
      sendCallSignalApi(currentCallId, currentPeerId, "ice", {
        candidate: ev.candidate,
      }).catch(function (e) { console.warn("ice send", e); });
    }
  };

  pc.ontrack = function (ev) {
    if (!remoteStream) remoteStream = new MediaStream();
    remoteStream.addTrack(ev.track);
    var remoteVideo = document.getElementById("call-remote-video");
    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play().catch(function () {});
    }
    if (currentCallType === "audio") {
      var audioEl = document.getElementById("call-remote-audio");
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

  pc.onconnectionstatechange = function () {
    if (!pc) return;
    var st = pc.connectionState;
    if (st === "connected") {
      setCallStatus("Connecté");
      startCallTimer();
    } else if (st === "failed" || st === "disconnected") {
      setCallStatus("Connexion perdue...");
    }
  };

  if (localStream) {
    localStream.getTracks().forEach(function (track) {
      pc.addTrack(track, localStream);
    });
  }

  return pc;
}

async function createAndSendOffer() {
  if (!pc || !currentCallId || !currentPeerId || offerSent) return;
  offerSent = true;
  var offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await sendCallSignalApi(currentCallId, currentPeerId, "offer", {
    sdp: pc.localDescription,
  });
}

async function handleRemoteOffer(sdp) {
  if (!pc) createPeerConnection();
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  var answer = await pc.createAnswer();
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
  var payload =
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

async function startOutgoingCall(context, type) {
  if (!state.user) {
    toast("Connecte-toi d'abord");
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("Ton navigateur ne supporte pas les appels");
    return;
  }

  // Validation contexte + récupération des IDs
  var privateCode = null;
  var spaceId = null;

  if (context === "private") {
    privateCode = state.currentPrivateCode || null;
    // Fallback : lire le code affiché dans l'UI
    if (!privateCode) {
      var codeEl = document.getElementById("private-chat-code");
      if (codeEl) {
        var m = (codeEl.textContent || "").match(/(\d{6})/);
        if (m) privateCode = m[1];
      }
    }
    if (!privateCode) {
      toast("Aucun chat privé sélectionné");
      return;
    }
  } else if (context === "space") {
    spaceId = state.currentSpaceId || null;
    if (!spaceId) {
      toast("Aucun espace sélectionné");
      return;
    }
  } else {
    toast("Contexte d'appel invalide");
    return;
  }

  try {
    isCaller = true;
    offerSent = false;
    showCallScreen(context, type, { incoming: false });
    setCallStatus("Connexion micro/caméra...");

    await getLocalMedia(type);

    var payload = { type: type, context: context };
    if (context === "private") {
      payload.privateCode = privateCode;
    } else {
      payload.spaceId = spaceId;
    }

    var res = await startCallApi(payload);
    currentCallId = res.callId;
    currentPeerId = res.calleeId || null;

    setCallStatus("Sonnerie...");
    createPeerConnection();
    startCallPolling();
  } catch (e) {
    console.error(e);
    toast(e.message || "Impossible de démarrer l'appel");
    cleanupCall();
  }
}

async function acceptIncomingCall() {
  if (!pendingIncoming) return;
  var call = pendingIncoming;
  pendingIncoming = null;

  try {
    isCaller = false;
    offerSent = false;
    currentCallId = call.id;
    currentCallType = call.type;
    currentCallContext = call.context;
    currentPeerId = call.caller_id;

    showCallScreen(call.context, call.type, { incoming: false });
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
  var call = pendingIncoming;
  pendingIncoming = null;
  try {
    await rejectCallApi(call.id);
  } catch (e) {}
  var screen = document.getElementById("call-screen");
  if (screen) screen.classList.remove("active");
  toast("Appel refusé");
}

async function hangupCall() {
  try {
    if (currentCallId) {
      await endCallApi(currentCallId).catch(function () {});
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
    try { pc.close(); } catch (e) {}
    pc = null;
  }
  remoteStream = null;
  currentCallId = null;
  currentPeerId = null;
  currentCallType = null;
  isCaller = false;
  offerSent = false;
  pendingIncoming = null;

  var screen = document.getElementById("call-screen");
  if (screen) screen.classList.remove("active");

  var audioEl = document.getElementById("call-remote-audio");
  if (audioEl) {
    audioEl.srcObject = null;
    audioEl.remove();
  }
}

function toggleMuteUI() {
  callMuted = !callMuted;
  if (localStream) {
    localStream.getAudioTracks().forEach(function (t) {
      t.enabled = !callMuted;
    });
  }
  var btn = document.getElementById("btn-call-mute");
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
    localStream.getVideoTracks().forEach(function (t) {
      t.enabled = !callCamOff;
    });
  }
  var btn = document.getElementById("btn-call-cam");
  if (btn) {
    btn.classList.toggle("off", callCamOff);
    btn.textContent = callCamOff ? "🚫" : "📷";
  }
  toast(callCamOff ? "Caméra coupée" : "Caméra activée");
}

function endCallUI() {
  hangupCall();
}

/** Point d'entrée pour bind.js – démarre un appel sortant */
function startCallUI(context, type) {
  startOutgoingCall(context, type);
}

function startCallPolling() {
  stopCallPolling();
  callPollTimer = setInterval(pollCalls, 800);
  pollCalls();
}

function stopCallPolling() {
  if (callPollTimer) {
    clearInterval(callPollTimer);
    callPollTimer = null;
  }
}

async function pollCalls() {
  if (!state.user || typeof getToken !== "function" || !getToken()) return;
  try {
    var data = await pollCallsApi(lastSignalId);

    if (data.signals && data.signals.length) {
      for (var i = 0; i < data.signals.length; i++) {
        var sig = data.signals[i];
        if (sig.id > lastSignalId) lastSignalId = sig.id;
        await processSignal(sig);
      }
    }

    if (data.incoming && data.incoming.length && !currentCallId && !pendingIncoming) {
      var call = data.incoming[0];
      pendingIncoming = call;
      showIncomingCall(call);
    }

    if (isCaller && currentCallId && pc) {
      var mine = null;
      var myCalls = data.myCalls || [];
      for (var j = 0; j < myCalls.length; j++) {
        if (myCalls[j].id === currentCallId) { mine = myCalls[j]; break; }
      }
      if (mine && mine.status === "active") {
        if (mine.callee_id) currentPeerId = mine.callee_id;
        if (currentPeerId && !offerSent) {
          setCallStatus("Établissement de la connexion...");
          await createAndSendOffer();
        }
      }
      if (mine && (mine.status === "ended" || mine.status === "rejected")) {
        toast(mine.status === "rejected" ? "Appel refusé" : "Appel terminé");
        cleanupCall();
      }
    }

    if (!isCaller && currentCallId) {
      var mine2 = null;
      var mc = data.myCalls || [];
      for (var k = 0; k < mc.length; k++) {
        if (mc[k].id === currentCallId) { mine2 = mc[k]; break; }
      }
      if (mine2 && (mine2.status === "ended" || mine2.status === "rejected")) {
        toast("Appel terminé");
        cleanupCall();
      }
    }

    if (pendingIncoming) {
      var still = null;
      var inc = data.incoming || [];
      for (var n = 0; n < inc.length; n++) {
        if (inc[n].id === pendingIncoming.id) { still = inc[n]; break; }
      }
      var mine3 = null;
      var mc2 = data.myCalls || [];
      for (var p = 0; p < mc2.length; p++) {
        if (mc2[p].id === pendingIncoming.id) { mine3 = mc2[p]; break; }
      }
      if (!still && (!mine3 || mine3.status !== "ringing")) {
        pendingIncoming = null;
        var sc = document.getElementById("call-screen");
        if (sc) sc.classList.remove("active");
        toast("Appel manqué");
      }
    }
  } catch (e) {
    // réseau
  }
}

function showIncomingCall(call) {
  var name = call.caller_name || (call.context === "space" ? "Espace" : "Appel entrant");
  showCallScreen(call.context, call.type, { incoming: true });
  var nameEl = document.getElementById("call-name");
  if (nameEl) nameEl.textContent = name;
  if (call.caller_avatar) {
    var avatarEl = document.getElementById("call-avatar");
    if (avatarEl) avatarEl.innerHTML = '<img src="' + call.caller_avatar + '" alt="">';
  }
  setCallStatus(call.type === "video" ? "Appel vidéo entrant..." : "Appel audio entrant...");
}

function ensureCallPolling() {
  if (!callPollTimer && state.user) {
    startCallPolling();
  }
}

window.alignStartCallPolling = ensureCallPolling;
