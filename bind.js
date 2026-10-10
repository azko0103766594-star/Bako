/* bind.js – Tous les event listeners + démarrage de l'app */

function bind() {
  document.getElementById('btn-gmail').onclick = () => {
    state.user = { email: 'demo@gmail.com', ok: false, avatar: null, firstname: '', username: '', bio: '', personalCode: code() };
    save();
    show('screen-profile');
  };

  document.getElementById('avatar-upload').onclick = () => document.getElementById('avatar-input').click();
  document.getElementById('avatar-input').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      if (state.user) state.user.avatar = ev.target.result;
      document.getElementById('avatar-preview').innerHTML = '<img src="' + ev.target.result + '">';
    };
    r.readAsDataURL(f);
  };

  document.getElementById('input-bio').oninput = e => {
    document.getElementById('bio-count').textContent = e.target.value.length;
  };

  const check = () => {
    const fn = (document.getElementById('input-firstname') || {}).value || '';
    const un = (document.getElementById('input-username') || {}).value || '';
    document.getElementById('btn-save-profile').disabled = !(fn.trim() && un.trim().length >= 3);
  };
  document.getElementById('input-firstname').oninput = check;
  document.getElementById('input-username').oninput = check;

  document.getElementById('btn-save-profile').onclick = () => {
    const fn = (document.getElementById('input-firstname').value || '').trim();
    let un = (document.getElementById('input-username').value || '').trim().replace(/[^a-zA-Z0-9._]/g, '');
    if (!fn || un.length < 3) { toast('Prénom et username (min 3) obligatoires'); return; }
    if (!state.user) state.user = {};
    state.user.firstname = fn;
    state.user.username = un;
    state.user.bio = (document.getElementById('input-bio').value || '').trim();
    state.user.ok = true;
    if (!state.user.personalCode) state.user.personalCode = code();
    if (!state.user.avatar) state.user.avatar = defaultAvatar(fn);
    save();
    renderHome();
    show('screen-home');
    toast('Profil créé ! Ton code : ' + state.user.personalCode);
  };

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


document.addEventListener('DOMContentLoaded', () => {
  load();
  if (state.user && state.user.ok) {
    renderHome();
    show('screen-home');
  } else if (state.user) {
    show('screen-profile');
  } else {
    show('screen-login');
  }
  bind();
});

