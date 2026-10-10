/* bind.js – Tous les event listeners + démarrage de l'app */

function bind() {
  // LOGIN – vrai Google OAuth via Cloudflare Worker
  const btnGmail = document.getElementById('btn-gmail');
  if (btnGmail) {
    btnGmail.onclick = function() {
      loginWithGoogle();   // redirige vers /api/auth/google
    };
  } else {
    console.error('[Align] btn-gmail introuvable');
  }

  // PROFILE
  const avatarUpload = document.getElementById('avatar-upload');
  if (avatarUpload) {
    avatarUpload.onclick = function() {
      const input = document.getElementById('avatar-input');
      if (input) input.click();
    };
  }

  const avatarInput = document.getElementById('avatar-input');
  if (avatarInput) {
    avatarInput.onchange = function(e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = function(ev) {
        if (state.user) state.user.avatar = ev.target.result;
        const preview = document.getElementById('avatar-preview');
        if (preview) preview.innerHTML = '<img src="' + ev.target.result + '">';
      };
      r.readAsDataURL(f);
    };
  }

  const inputBio = document.getElementById('input-bio');
  if (inputBio) {
    inputBio.oninput = function(e) {
      const count = document.getElementById('bio-count');
      if (count) count.textContent = e.target.value.length;
    };
  }

  const check = function() {
    const fn = (document.getElementById('input-firstname') || {}).value || '';
    const un = (document.getElementById('input-username') || {}).value || '';
    const btn = document.getElementById('btn-save-profile');
    if (btn) btn.disabled = !(fn.trim() && un.trim().length >= 3);
  };
  const inputFirst = document.getElementById('input-firstname');
  const inputUser = document.getElementById('input-username');
  if (inputFirst) inputFirst.oninput = check;
  if (inputUser) inputUser.oninput = check;

  const btnSaveProfile = document.getElementById('btn-save-profile');
  if (btnSaveProfile) {
    btnSaveProfile.onclick = async function() {
      const fn = (document.getElementById('input-firstname').value || '').trim();
      let un = (document.getElementById('input-username').value || '').trim().replace(/[^a-zA-Z0-9._]/g, '');
      const bio = (document.getElementById('input-bio').value || '').trim();
      if (!fn || un.length < 3) { toast('Prénom et username (min 3) obligatoires'); return; }

      try {
        btnSaveProfile.disabled = true;
        const updated = await updateProfileApi({
          firstname: fn,
          username: un,
          bio: bio,
          avatar: state.user && state.user.avatar ? state.user.avatar : null
        });
        setUser(updated);
        save();
        renderHome();
        show('screen-home');
        toast('Profil créé ! Ton code : ' + (updated.personalCode || ''));
      } catch (e) {
        toast(e.message || 'Erreur');
      } finally {
        btnSaveProfile.disabled = false;
      }
    };
  }

  document.getElementById('btn-create-space').onclick = () => {
    document.getElementById('space-name').value = '';
    document.getElementById('space-desc').value = '';
    show('screen-create');
  };
  document.getElementById('btn-join-space').onclick = () => {
    document.getElementById('join-code').value = '';
    show('screen-join');
  };
  document.getElementById('btn-private-msg').onclick = () => {
    renderPrivateList();
    show('screen-messages');
  };

  document.getElementById('btn-back-create').onclick = () => show('screen-home');
  document.getElementById('btn-back-join').onclick = () => show('screen-home');
  document.getElementById('btn-back-space').onclick = () => {
    state.currentSpaceId = null;
    renderHome();
    show('screen-home');
  };
  document.getElementById('btn-back-messages').onclick = () => show('screen-home');
  document.getElementById('btn-back-private-chat').onclick = () => {
    state.currentPrivateCode = null;
    renderPrivateList();
    show('screen-messages');
  };

  document.getElementById('btn-confirm-create').onclick = () => { try { createSpace(); } catch(e) { toast('Erreur'); } };
  document.getElementById('btn-join-code').onclick = () => { try { joinSpace(); } catch(e) { toast('Erreur'); } };
  document.getElementById('btn-start-chat').onclick = startPrivateChat;

  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('tab-' + t.dataset.tab);
      if (panel) panel.classList.add('active');
      if (t.dataset.tab === 'plans') renderDecisions();
      if (t.dataset.tab === 'infos') renderInfos();
    };
  });

  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      state.currentThread = c.dataset.thread || 'general';
      renderMessages();
    };
  });

  document.getElementById('btn-send-msg').onclick = sendMsg;
  document.getElementById('message-input').onkeypress = e => { if (e.key === 'Enter') sendMsg(); };
  document.getElementById('btn-send-private').onclick = sendPrivateMsg;
  document.getElementById('private-message-input').onkeypress = e => { if (e.key === 'Enter') sendPrivateMsg(); };

  document.getElementById('btn-new-decision').onclick = () => {
    document.getElementById('decision-question').value = '';
    document.getElementById('decision-options').value = '';
    document.getElementById('modal-decision').classList.add('show');
  };
  document.getElementById('btn-cancel-decision').onclick = () => {
    document.getElementById('modal-decision').classList.remove('show');
  };
  document.getElementById('btn-confirm-decision').onclick = createDecision;

  document.getElementById('btn-copy-link').onclick = () => {
    const i = document.getElementById('invite-link');
    if (i) navigator.clipboard.writeText(i.value).then(() => toast('Lien copié !'));
  };

  // Media attach & voice
  document.getElementById('btn-attach-space').onclick = () => document.getElementById('file-space').click();
  document.getElementById('btn-attach-private').onclick = () => document.getElementById('file-private').click();
  document.getElementById('file-space').onchange = e => handleMediaFile(e, 'space');
  document.getElementById('file-private').onchange = e => handleMediaFile(e, 'private');

  document.getElementById('btn-mic-space').onclick = () => toggleRecord('space');
  document.getElementById('btn-mic-private').onclick = () => toggleRecord('private');
  document.getElementById('btn-stop-space').onclick = () => stopRecord('space');
  document.getElementById('btn-stop-private').onclick = () => stopRecord('private');

  // Call buttons (audio / video)
  document.getElementById('btn-call-audio-space').onclick = () => startCallUI('space', 'audio');
  document.getElementById('btn-call-video-space').onclick = () => startCallUI('space', 'video');
  document.getElementById('btn-call-audio-private').onclick = () => startCallUI('private', 'audio');
  document.getElementById('btn-call-video-private').onclick = () => startCallUI('private', 'video');
  document.getElementById('btn-call-hangup').onclick = endCallUI;
  document.getElementById('btn-call-mute').onclick = toggleMuteUI;
  document.getElementById('btn-call-cam').onclick = toggleCamUI;

  // Private contact edit / delete / pin / archive
  document.getElementById('btn-private-menu').onclick = openPrivateEditModal;
  document.getElementById('private-header-clickable').onclick = openPrivateEditModal;
  document.getElementById('btn-save-private').onclick = savePrivateContact;
  document.getElementById('btn-delete-private').onclick = deletePrivateChat;
  document.getElementById('btn-pin-private').onclick = togglePinConversation;
  document.getElementById('btn-archive-private').onclick = toggleArchiveConversation;
  document.getElementById('private-avatar-upload').onclick = () => document.getElementById('private-avatar-input').click();
  document.getElementById('private-avatar-input').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      document.getElementById('private-avatar-preview').innerHTML = '<img src="' + ev.target.result + '">';
      document.getElementById('private-avatar-preview').dataset.src = ev.target.result;
    };
    r.readAsDataURL(f);
  };

  // Search + tabs
  const searchInput = document.getElementById('private-search');
  if (searchInput) {
    searchInput.oninput = () => renderPrivateList();
  }
  document.querySelectorAll('.private-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.private-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.privateFilter = tab.dataset.filter || 'all';
      renderPrivateList();
    };
  });

  // Message actions
  document.getElementById('btn-msg-delete-me').onclick = () => deleteMessage(false);
  document.getElementById('btn-msg-delete-all').onclick = () => deleteMessage(true);
  document.getElementById('btn-msg-pin').onclick = pinMessage;
  document.getElementById('btn-msg-cancel').onclick = () => {
    document.getElementById('modal-msg-actions').classList.remove('show');
  };
}


document.addEventListener('DOMContentLoaded', async () => {
  load();
  bind();

  // 1. Check if we just came back from Google OAuth
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  if (tokenFromUrl) {
    setToken(tokenFromUrl);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. Try to restore session
  const token = getToken();
  if (token) {
    try {
      const me = await fetchMe();
      setUser(me);
      if (me.ok) {
        renderHome();
        show("screen-home");
      } else {
        show("screen-profile");
      }
      return;
    } catch (e) {
      console.warn("Session invalid", e);
      setToken(null);
    }
  }

  // 3. No session → login
  show("screen-login");
});

