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
  state.selectedMsgId = msgId;
  document.getElementById('modal-msg-actions').classList.add('show');
}

function deleteMessage(forEveryone) {
  const pCode = state.currentPrivateCode;
  const msgId = state.selectedMsgId;
  if (!pCode || !msgId || !state.privateChats[pCode]) return;

  const chat = state.privateChats[pCode];
  const msg = chat.messages.find(m => m.id === msgId);
  if (!msg) return;

  if (forEveryone) {
    // Remove completely (local = "for everyone")
    chat.messages = chat.messages.filter(m => m.id !== msgId);
    toast('Message supprimé pour tout le monde');
  } else {
    // Delete for me only
    msg.deletedForMe = true;
    toast('Message supprimé pour moi');
  }

  chat.updatedAt = Date.now();
  save();
  document.getElementById('modal-msg-actions').classList.remove('show');
  renderPrivateMessages();
}

function pinMessage() {
  const pCode = state.currentPrivateCode;
  const msgId = state.selectedMsgId;
  if (!pCode || !msgId || !state.privateChats[pCode]) return;

  const chat = state.privateChats[pCode];
  const msg = chat.messages.find(m => m.id === msgId);
  if (!msg) return;

  msg.pinned = !msg.pinned;
  save();
  document.getElementById('modal-msg-actions').classList.remove('show');
  renderPrivateMessages();
  toast(msg.pinned ? 'Message épinglé' : 'Message désépinglé');
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
