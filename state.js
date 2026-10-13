/* state.js – État global + persistance (token + cache local) */

const state = {
  user: null,
  spaces: [],
  currentSpaceId: null,
  currentThread: "general",
  messages: {},
  decisions: {},
  privateChats: {},
  currentPrivateCode: null,
  privateFilter: "all",
  selectedMsgId: null,
  loading: false,
};

function load() {
  // On garde un petit cache local pour le mode offline / fallback
  try {
    const s = localStorage.getItem("align_v5_cache");
    if (s) {
      const p = JSON.parse(s);
      state.spaces = Array.isArray(p.spaces) ? p.spaces : [];
      state.messages = p.messages || {};
      state.decisions = p.decisions || {};
      state.privateChats = p.privateChats || {};
    }
  } catch (e) {
    localStorage.removeItem("align_v5_cache");
  }
}

function save() {
  try {
    localStorage.setItem(
      "align_v5_cache",
      JSON.stringify({
        spaces: state.spaces,
        messages: state.messages,
        decisions: state.decisions,
        privateChats: state.privateChats,
      })
    );
  } catch (e) {
    console.error(e);
  }
}

function setUser(user) {
  state.user = user;
}
