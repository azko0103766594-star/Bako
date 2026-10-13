/* actions.js – Edition contact, pin, archive, suppression messages */

// ========== PRIVATE CONTACT EDIT ==========
function savePrivateContact() {
  const pCode = state.currentPrivateCode;
  if (!pCode || !state.privateChats[pCode]) return;

  const name = (document.getElementById('private-edit-name').value || '').trim();
  if (name) state.privateChats[pCode].otherName = name;

  const preview = document.getElementById('private-avatar-preview');
  if (preview.dataset.src) {
    state.privateChats[pCode].otherAvatar = preview.dataset.src;
  }

  save();
  document.getElementById('modal-private-edit').classList.remove('show');
  document.getElementById('private-chat-name').textContent = state.privateChats[pCode].otherName;
  renderPrivateMessages();
  toast('Contact mis à jour');
}

function deletePrivateChat() {
  const pCode = state.currentPrivateCode;
  if (!pCode) return;
  if (!confirm('Supprimer cette conversation ?')) return;

  delete state.privateChats[pCode];
  save();
  document.getElementById('modal-private-edit').classList.remove('show');
  state.currentPrivateCode = null;
  renderPrivateList();
  show('screen-messages');
  toast('Conversation supprimée');
}

// ========== PIN / ARCHIVE / DELETE MESSAGE ==========
function openMsgActions(msgId) {
  if (!msgId) return;
  state.selectedMsgId = String(msgId);
  // Savoir si on est en privé ou en espace
  state.selectedMsgContext = state.currentPrivateCode ? 'private' : 'space';
  const modal = document.getElementById('modal-msg-actions');
  if (modal) modal.classList.add('show');
}

function findSelectedMessage() {
  const msgId = state.selectedMsgId;
  if (!msgId) return null;

  // Chat privé
  if (state.currentPrivateCode && state.privateChats[state.currentPrivateCode]) {
    const chat = state.privateChats[state.currentPrivateCode];
    const msg = (chat.messages || []).find(m => String(m.id) === String(msgId));
    if (msg) return { msg, context: 'private', chat };
  }

  // Espace
  if (state.currentSpaceId && state.messages[state.currentSpaceId]) {
    const sid = state.currentSpaceId;
    const th = state.currentThread || 'general';
    const list = (state.messages[sid] && state.messages[sid][th]) || [];
    const msg = list.find(m => String(m.id) === String(msgId));
    if (msg) return { msg, context: 'space', list, sid, th };
  }

  return null;
}

async function deleteMessage(forEveryone) {
  const found = findSelectedMessage();
  if (!found) {
    toast('Message introuvable');
    return;
  }

  const { msg, context } = found;
  const msgId = String(msg.id);

  // Fermer le modal tout de suite
  const modal = document.getElementById('modal-msg-actions');
  if (modal) modal.classList.remove('show');

  if (forEveryone) {
    // Suppression locale immédiate
    if (context === 'private') {
      found.chat.messages = (found.chat.messages || []).filter(m => String(m.id) !== msgId);
      found.chat.updatedAt = Date.now();
      if (typeof renderPrivateMessages === 'function') renderPrivateMessages();
    } else if (found.sid && found.th) {
      const arr = state.messages[found.sid][found.th] || [];
      state.messages[found.sid][found.th] = arr.filter(m => String(m.id) !== msgId);
      if (typeof renderMessages === 'function') renderMessages();
    }
    toast('Message supprimé');

    // Appel API (si dispo)
    try {
      if (typeof deleteMessageApi === 'function') {
        await deleteMessageApi(msgId, { forEveryone: true, context });
      }
    } catch (err) {
      console.warn('delete API', err);
    }
  } else {
    // Supprimer pour moi uniquement
    msg.deletedForMe = true;
    if (context === 'private') {
      found.chat.updatedAt = Date.now();
      if (typeof renderPrivateMessages === 'function') renderPrivateMessages();
    } else {
      if (typeof renderMessages === 'function') renderMessages();
    }
    toast('Message supprimé pour moi');
  }

  save();
  state.selectedMsgId = null;
}

function pinMessage() {
  const found = findSelectedMessage();
  if (!found) {
    toast('Message introuvable');
    return;
  }

  found.msg.pinned = !found.msg.pinned;
  save();

  const modal = document.getElementById('modal-msg-actions');
  if (modal) modal.classList.remove('show');

  if (found.context === 'private') {
    renderPrivateMessages();
  } else {
    renderMessages();
  }
  toast(found.msg.pinned ? 'Message épinglé' : 'Message désépinglé');
}

function togglePinConversation() {
  const pCode = state.currentPrivateCode;
  if (!pCode || !state.privateChats[pCode]) return;
  const chat = state.privateChats[pCode];
  chat.pinned = !chat.pinned;
  save();
  document.getElementById('modal-private-edit').classList.remove('show');
  toast(chat.pinned ? 'Conversation épinglée' : 'Conversation désépinglée');
  renderPrivateList();
}

function toggleArchiveConversation() {
  const pCode = state.currentPrivateCode;
  if (!pCode || !state.privateChats[pCode]) return;
  const chat = state.privateChats[pCode];
  chat.archived = !chat.archived;
  if (chat.archived) chat.pinned = false;
  save();
  document.getElementById('modal-private-edit').classList.remove('show');
  state.currentPrivateCode = null;
  renderPrivateList();
  show('screen-messages');
  toast(chat.archived ? 'Conversation archivée' : 'Conversation désarchivée');
}

function openPrivateEditModal() {
  const pCode = state.currentPrivateCode;
  if (!pCode || !state.privateChats[pCode]) return;
  const chat = state.privateChats[pCode];

  document.getElementById('private-edit-name').value = chat.otherName || '';
  const preview = document.getElementById('private-avatar-preview');
  if (chat.otherAvatar) {
    preview.innerHTML = '<img src="' + chat.otherAvatar + '">';
    preview.dataset.src = chat.otherAvatar;
  } else {
    preview.innerHTML = '<span>+</span>';
    preview.dataset.src = '';
  }

  const pinBtn = document.getElementById('btn-pin-private');
  const archBtn = document.getElementById('btn-archive-private');
  if (pinBtn) pinBtn.textContent = chat.pinned ? 'Désépingler' : 'Épingler';
  if (archBtn) archBtn.textContent = chat.archived ? 'Désarchiver' : 'Archiver';

  document.getElementById('modal-private-edit').classList.add('show');
}
