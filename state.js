/* state.js – État global + persistance localStorage */

const state = {
  user: null,
  spaces: [],
  currentSpaceId: null,
  currentThread: 'general',
  messages: {},
  decisions: {},
  privateChats: {},
  currentPrivateCode: null,
  privateFilter: 'all', // all | pinned | archived
  selectedMsgId: null
};

function load() {
  try {
    const s = localStorage.getItem('align_v4');
    if (s) {
      const p = JSON.parse(s);
      state.user = p.user || null;
      state.spaces = Array.isArray(p.spaces) ? p.spaces : [];
      state.messages = p.messages || {};
      state.decisions = p.decisions || {};
      state.privateChats = p.privateChats || {};
    }
  } catch (e) {
    localStorage.removeItem('align_v4');
  }
}

function save() {
  try {
    localStorage.setItem('align_v4', JSON.stringify({
      user: state.user,
      spaces: state.spaces,
      messages: state.messages,
      decisions: state.decisions,
      privateChats: state.privateChats
    }));
  } catch (e) {
    console.error(e);
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      toast('Stockage plein — supprime d\'anciens médias');
    } else {
      toast('Erreur de sauvegarde');
    }
  }
}
