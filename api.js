/* api.js – Client API Align (Render) */

const API_BASE = window.ALIGN_API_URL || "";

function getToken() {
  return localStorage.getItem("align_token");
}

function setToken(token) {
  if (token) localStorage.setItem("align_token", token);
  else localStorage.removeItem("align_token");
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  headers["Content-Type"] = headers["Content-Type"] || "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    setToken(null);
    // Redirect to login
    if (typeof show === "function") show("screen-login");
    throw new Error("Session expirée");
  }

  if (!res.ok) {
    throw new Error(data.error || "Erreur serveur");
  }

  return data;
}

// Auth
function loginWithGoogle() {
  // Redirect to Worker Google OAuth
  window.location.href = API_BASE + "/api/auth/google";
}

async function fetchMe() {
  return api("/api/auth/me");
}

async function logoutApi() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch (e) {}
  setToken(null);
}

// Profile
async function updateProfileApi(data) {
  return api("/api/profile", { method: "PUT", body: JSON.stringify(data) });
}

// Spaces
async function listSpacesApi() {
  return api("/api/spaces");
}

async function createSpaceApi(name, description) {
  return api("/api/spaces", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

async function joinSpaceApi(code) {
  return api("/api/spaces/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// Messages
async function getSpaceMessagesApi(spaceId) {
  return api(`/api/spaces/${spaceId}/messages`);
}

async function sendSpaceMessageApi(spaceId, payload) {
  return api(`/api/spaces/${spaceId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Private
async function listPrivateChatsApi() {
  return api("/api/private");
}

async function startPrivateChatApi(code) {
  return api("/api/private/start", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

async function getPrivateMessagesApi(code) {
  return api(`/api/private/${code}/messages`);
}

async function sendPrivateMessageApi(code, payload) {
  return api(`/api/private/${code}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Media
async function uploadMediaApi(file) {
  const form = new FormData();
  form.append("file", file);
  const token = getToken();
  const res = await fetch(API_BASE + "/api/media/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

// Decisions
async function getDecisionsApi(spaceId) {
  return api(`/api/spaces/${spaceId}/decisions`);
}

async function createDecisionApi(spaceId, question, options) {
  return api(`/api/spaces/${spaceId}/decisions`, {
    method: "POST",
    body: JSON.stringify({ question, options }),
  });
}

async function voteDecisionApi(decisionId, optionId) {
  return api(`/api/decisions/${decisionId}/vote`, {
    method: "POST",
    body: JSON.stringify({ optionId }),
  });
}
