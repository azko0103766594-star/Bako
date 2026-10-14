
/* bind.js – Tous les event listeners + démarrage de l'app */

function bind() {
  // LOGIN – Google OAuth via le backend Render
  const btnGmail = document.getElementById("btn-gmail");

  if (btnGmail) {
    btnGmail.onclick = function () {
      loginWithGoogle();
    };
  } else {
    console.error("[Align] btn-gmail introuvable");
  }

  // PROFILE – Avatar
  const avatarUpload = document.getElementById("avatar-upload");
  if (avatarUpload) {
    avatarUpload.onclick = function () {
      const input = document.getElementById("avatar-input");
      if (input) input.click();
    };
  }

  const avatarInput = document.getElementById("avatar-input");
  if (avatarInput) {
    avatarInput.onchange = function (e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;

      const r = new FileReader();
      r.onload = function (ev) {
        if (state.user) state.user.avatar = ev.target.result;

        const preview = document.getElementById("avatar-preview");
        if (preview) {
          preview.innerHTML = "<img src='" + ev.target.result + "'>";
        }
      };
      r.readAsDataURL(f);
    };
  }

  // BIO
  const inputBio = document.getElementById("input-bio");
  if (inputBio) {
    inputBio.oninput = function (e) {
      const count = document.getElementById("bio-count");
      if (count) count.textContent = e.target.value.length;
    };
  }

  // Validation du profil
  const check = function () {
    const fn = (document.getElementById("input-firstname") || {}).value || "";
    const un = (document.getElementById("input-username") || {}).value || "";
    const btn = document.getElementById("btn-save-profile");

    if (btn) btn.disabled = !(fn.trim() && un.trim().length >= 3);
  };

  const inputFirst = document.getElementById("input-firstname");
  const inputUser = document.getElementById("input-username");

  if (inputFirst) inputFirst.oninput = check;
  if (inputUser) inputUser.oninput = check;

  // Enregistrer le profil
  const btnSaveProfile = document.getElementById("btn-save-profile");

  if (btnSaveProfile) {
    btnSaveProfile.onclick = async function () {
      const firstInput = document.getElementById("input-firstname");
      const userInput = document.getElementById("input-username");
      const bioInput = document.getElementById("input-bio");

      const fn = (firstInput?.value || "").trim();
      const un = (userInput?.value || "")
        .trim()
        .replace(/[^a-zA-Z0-9._]/g, "");
      const bio = (bioInput?.value || "").trim();

      if (!fn || un.length < 3) {
        toast("Prénom et username (min 3) obligatoires");
        return;
      }

      try {
        btnSaveProfile.disabled = true;

        const updated = await updateProfileApi({
          firstname: fn,
          username: un,
          bio: bio,
          avatar:
            state.user && state.user.avatar
              ? state.user.avatar
              : null,
        });

        setUser(updated);
        save();
        renderHome();
        show("screen-home");
        toast("Profil créé ! Ton code : " + (updated.personalCode || ""));
      } catch (e) {
        toast(e.message || "Erreur");
      } finally {
        btnSaveProfile.disabled = false;
      }
    };
  }

  // Espaces
  const createBtn = document.getElementById("btn-create-space");
  if (createBtn) {
    createBtn.onclick = () => {
      document.getElementById("space-name").value = "";
      document.getElementById("space-desc").value = "";
      show("screen-create");
    };
  }

  const joinBtn = document.getElementById("btn-join-space");
  if (joinBtn) {
    joinBtn.onclick = () => {
      document.getElementById("join-code").value = "";
      show("screen-join");
    };
  }

  const privateMsgBtn = document.getElementById("btn-private-msg");
  if (privateMsgBtn) {
    privateMsgBtn.onclick = async () => {
      show("screen-messages");
      if (typeof syncPrivateChatsFromServer === "function") {
        await syncPrivateChatsFromServer();
      } else {
        renderPrivateList();
      }
    };
  }

  const backCreate = document.getElementById("btn-back-create");
  if (backCreate) backCreate.onclick = () => show("screen-home");

  const backJoin = document.getElementById("btn-back-join");
  if (backJoin) backJoin.onclick = () => show("screen-home");

  const backSpace = document.getElementById("btn-back-space");
  if (backSpace) {
    backSpace.onclick = () => {
      state.currentSpaceId = null;
      renderHome();
      show("screen-home");
    };
  }

  const backMessages = document.getElementById("btn-back-messages");
  if (backMessages) backMessages.onclick = () => show("screen-home");

  const backPrivate = document.getElementById("btn-back-private-chat");
  if (backPrivate) {
    backPrivate.onclick = async () => {
      state.currentPrivateCode = null;
      show("screen-messages");
      if (typeof syncPrivateChatsFromServer === "function") {
        await syncPrivateChatsFromServer();
      } else {
        renderPrivateList();
      }
    };
  }

  const confirmCreate = document.getElementById("btn-confirm-create");
  if (confirmCreate) {
    confirmCreate.onclick = () => {
      try {
        createSpace();
      } catch (e) {
        toast("Erreur");
      }
    };
  }

  const joinCode = document.getElementById("btn-join-code");
  if (joinCode) {
    joinCode.onclick = () => {
      try {
        joinSpace();
      } catch (e) {
        toast("Erreur");
      }
    };
  }

  const startChat = document.getElementById("btn-start-chat");
  if (startChat) startChat.onclick = startPrivateChat;

  // Onglets
  document.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => {
      document.querySelectorAll(".tab").forEach((x) =>
        x.classList.remove("active")
      );

      t.classList.add("active");

      document.querySelectorAll(".tab-panel").forEach((p) =>
        p.classList.remove("active")
      );

      const panel = document.getElementById("tab-" + t.dataset.tab);
      if (panel) panel.classList.add("active");

      if (t.dataset.tab === "plans") {
        if (typeof loadDecisions === "function") loadDecisions(state.currentSpaceId);
        else renderDecisions();
      }
      if (t.dataset.tab === "infos") renderInfos();
    };
  });

  // Fils de discussion
  document.querySelectorAll(".chip").forEach((c) => {
    c.onclick = () => {
      document.querySelectorAll(".chip").forEach((x) =>
        x.classList.remove("active")
      );

      c.classList.add("active");
      state.currentThread = c.dataset.thread || "general";
      renderMessages();
    };
  });

  const sendMsgBtn = document.getElementById("btn-send-msg");
  if (sendMsgBtn) sendMsgBtn.onclick = sendMsg;

  const messageInput = document.getElementById("message-input");
  if (messageInput) {
    messageInput.onkeypress = (e) => {
      if (e.key === "Enter") sendMsg();
    };
  }

  const sendPrivateBtn = document.getElementById("btn-send-private");
  if (sendPrivateBtn) sendPrivateBtn.onclick = sendPrivateMsg;

  const privateInput = document.getElementById("private-message-input");
  if (privateInput) {
    privateInput.onkeypress = (e) => {
      if (e.key === "Enter") sendPrivateMsg();
    };
  }

  // Décisions
  const newDecision = document.getElementById("btn-new-decision");
  if (newDecision) {
    newDecision.onclick = () => {
      document.getElementById("decision-question").value = "";
      document.getElementById("decision-options").value = "";
      document.getElementById("modal-decision").classList.add("show");
    };
  }

  const cancelDecision = document.getElementById("btn-cancel-decision");
  if (cancelDecision) {
    cancelDecision.onclick = () => {
      document.getElementById("modal-decision").classList.remove("show");
    };
  }

  const confirmDecision = document.getElementById("btn-confirm-decision");
  if (confirmDecision) confirmDecision.onclick = createDecision;

  // Copier le lien d'invitation
  const copyLink = document.getElementById("btn-copy-link");
  if (copyLink) {
    copyLink.onclick = () => {
      const input = document.getElementById("invite-link");

      if (input) {
        navigator.clipboard.writeText(input.value)
          .then(() => toast("Lien copié !"))
          .catch(() => toast("Impossible de copier le lien"));
      }
    };
  }

  // Pièces jointes
  const attachSpace = document.getElementById("btn-attach-space");
  if (attachSpace) {
    attachSpace.onclick = () => document.getElementById("file-space").click();
  }

  const attachPrivate = document.getElementById("btn-attach-private");
  if (attachPrivate) {
    attachPrivate.onclick = () => document.getElementById("file-private").click();
  }

  const fileSpace = document.getElementById("file-space");
  if (fileSpace) {
    fileSpace.onchange = (e) => handleMediaFile(e, "space");
  }

  const filePrivate = document.getElementById("file-private");
  if (filePrivate) {
    filePrivate.onchange = (e) => handleMediaFile(e, "private");
  }

  // Messages vocaux
  const micSpace = document.getElementById("btn-mic-space");
  if (micSpace) micSpace.onclick = () => toggleRecord("space");

  const micPrivate = document.getElementById("btn-mic-private");
  if (micPrivate) micPrivate.onclick = () => toggleRecord("private");

  const stopSpace = document.getElementById("btn-stop-space");
  if (stopSpace) stopSpace.onclick = () => stopRecord("space");

  const stopPrivate = document.getElementById("btn-stop-private");
  if (stopPrivate) stopPrivate.onclick = () => stopRecord("private");

  // Appels audio / vidéo
  const audioSpace = document.getElementById("btn-call-audio-space");
  if (audioSpace) audioSpace.onclick = () => startCallUI("space", "audio");

  const videoSpace = document.getElementById("btn-call-video-space");
  if (videoSpace) videoSpace.onclick = () => startCallUI("space", "video");

  const audioPrivate = document.getElementById("btn-call-audio-private");
  if (audioPrivate) audioPrivate.onclick = () => startCallUI("private", "audio");

  const videoPrivate = document.getElementById("btn-call-video-private");
  if (videoPrivate) videoPrivate.onclick = () => startCallUI("private", "video");

  const hangup = document.getElementById("btn-call-hangup");
  if (hangup) hangup.onclick = endCallUI;

  const mute = document.getElementById("btn-call-mute");
  if (mute) mute.onclick = toggleMuteUI;

  const cam = document.getElementById("btn-call-cam");
  if (cam) cam.onclick = toggleCamUI;

  const acceptBtn = document.getElementById("btn-call-accept");
  if (acceptBtn) acceptBtn.onclick = acceptIncomingCall;

  const rejectBtn = document.getElementById("btn-call-reject");
  if (rejectBtn) rejectBtn.onclick = rejectIncomingCall;

  // Gestion des conversations privées
  const privateMenu = document.getElementById("btn-private-menu");
  if (privateMenu) privateMenu.onclick = openPrivateEditModal;

  const privateHeader = document.getElementById("private-header-clickable");
  if (privateHeader) privateHeader.onclick = openPrivateEditModal;

  const savePrivate = document.getElementById("btn-save-private");
  if (savePrivate) savePrivate.onclick = savePrivateContact;

  const deletePrivate = document.getElementById("btn-delete-private");
  if (deletePrivate) deletePrivate.onclick = deletePrivateChat;

  const pinPrivate = document.getElementById("btn-pin-private");
  if (pinPrivate) pinPrivate.onclick = togglePinConversation;

  const archivePrivate = document.getElementById("btn-archive-private");
  if (archivePrivate) archivePrivate.onclick = toggleArchiveConversation;

  const privateAvatarUpload = document.getElementById("private-avatar-upload");
  if (privateAvatarUpload) {
    privateAvatarUpload.onclick = () =>
      document.getElementById("private-avatar-input").click();
  }

  const privateAvatarInput = document.getElementById("private-avatar-input");
  if (privateAvatarInput) {
    privateAvatarInput.onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;

      const r = new FileReader();
      r.onload = (ev) => {
        const preview = document.getElementById("private-avatar-preview");
        if (preview) {
          preview.innerHTML = "<img src='" + ev.target.result + "'>";
          preview.dataset.src = ev.target.result;
        }
      };
      r.readAsDataURL(f);
    };
  }

  // Recherche des conversations
  const searchInput = document.getElementById("private-search");
  if (searchInput) searchInput.oninput = () => renderPrivateList();

  document.querySelectorAll(".private-tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".private-tab").forEach((t) =>
        t.classList.remove("active")
      );

      tab.classList.add("active");
      state.privateFilter = tab.dataset.filter || "all";
      renderPrivateList();
    };
  });

  // Actions sur les messages
  const deleteMe = document.getElementById("btn-msg-delete-me");
  if (deleteMe) deleteMe.onclick = () => deleteMessage(false);

  const deleteAll = document.getElementById("btn-msg-delete-all");
  if (deleteAll) deleteAll.onclick = () => deleteMessage(true);

  const pinMsg = document.getElementById("btn-msg-pin");
  if (pinMsg) pinMsg.onclick = pinMessage;

  const cancelMsg = document.getElementById("btn-msg-cancel");
  if (cancelMsg) {
    cancelMsg.onclick = () => {
      document.getElementById("modal-msg-actions").classList.remove("show");
    };
  }
}

// Démarrage de l'application et restauration de session
document.addEventListener("DOMContentLoaded", async () => {
  load();
  bind();

  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const authError = params.get("error");

  // Nettoyer l'URL sans perdre le token avant de l'enregistrer
  if (tokenFromUrl || authError) {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }

  // Afficher une erreur OAuth explicite
  if (authError) {
    console.error("[Align] Erreur Google OAuth :", authError);
    setToken(null);
    show("screen-login");

    if (typeof toast === "function") {
      toast("Connexion Google impossible : " + authError);
    }
    return;
  }

  // Enregistrer le token renvoyé par le backend
  if (tokenFromUrl) {
    setToken(tokenFromUrl);
  }

  // Restaurer la session
  const token = getToken();

  if (token) {
    try {
      const me = await fetchMe();
      setUser(me);

      if (me.ok) {
        renderHome();
        show("screen-home");
        if (typeof refreshSpacesFromApi === "function") refreshSpacesFromApi();
        // Chats privés = source serveur (même liste sur tous les appareils)
        if (typeof syncPrivateChatsFromServer === "function") {
          syncPrivateChatsFromServer().catch(() => {});
        }
        // Activer push en douceur (sans forcer si déjà refusé)
        if (typeof initAlignNotifications === "function" && Notification.permission !== "denied") {
          setTimeout(() => initAlignNotifications().catch(() => {}), 1500);
        }
      } else {
        show("screen-profile");
      }
      return;
    } catch (e) {
      console.error("[Align] Session invalide :", e);
      setToken(null);

      if (typeof toast === "function") {
        toast("Session invalide. Reconnecte-toi.");
      }
    }
  }

  show("screen-login");
});
