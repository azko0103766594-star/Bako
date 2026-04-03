const WORKER_URL = "https://shrill-dream-65ce.azko0103766594.workers.dev/";

let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("userId", userId);
}

let photos = [];
const feed = document.getElementById("feed");

/* ===== AFFICHER LES POSTS ===== */
function render() {
  feed.innerHTML = "";

  if (photos.length === 0) {
    feed.innerHTML = '<div class="empty">Aucune image pour le moment</div>';
    return;
  }

  photos.forEach((p) => {
    const liked = p.likesUsers?.includes(userId) || false;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.image_url}" alt="${p.title}">
      <div class="actions">
        <span>❤️ ${p.likes} | 👁️ ${p.views}</span>
        <button class="like-btn" onclick="toggleLike('${p.id}')">
          ${liked ? "Dislike" : "Like"}
        </button>
      </div>
      <div style="padding:10px">
        <div id="comments-${p.id}">
          ${p.comments.map(c => `<p>💬 ${c.username}: ${c.content}</p>`).join("")}
        </div>
        <input 
          id="input-${p.id}" 
          placeholder="Écrire un commentaire..." 
          style="width:70%;padding:6px;border-radius:10px;border:1px solid #ccc">
        <button onclick="addComment('${p.id}')">Envoyer</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

/* ===== CHARGER LES POSTS ===== */
async function loadPosts() {
  const res = await fetch(`${WORKER_URL}/posts`);
  const posts = await res.json();

  photos = posts.map(p => ({
    ...p,
    likesUsers: Array(p.likes).fill("user_placeholder"), // pour compatibilité front
    viewsUsers: Array(p.views).fill("user_placeholder")
  }));

  render();
}

/* ===== UPLOAD IMAGE ===== */
document.getElementById("upload").addEventListener("change", async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function() {
    const data = { title: "Nouvelle image", image_url: reader.result };

    await fetch(`${WORKER_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    await loadPosts();
  };
  reader.readAsDataURL(file);
});

/* ===== LIKE ===== */
async function toggleLike(postId) {
  await fetch(`${WORKER_URL}/posts/${postId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "like" })
  });

  await loadPosts();
}

/* ===== COMMENT ===== */
async function addComment(postId) {
  const input = document.getElementById("input-" + postId);
  const text = input.value.trim();
  if (!text) return;

  await fetch(`${WORKER_URL}/posts/${postId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "comment", username: userId, content: text })
  });

  input.value = "";
  await loadPosts();
}

/* ===== VUE (1 seule fois par utilisateur) ===== */
async function addView(postId) {
  await fetch(`${WORKER_URL}/posts/${postId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "view" })
  });
}

/* ===== CHARGEMENT INITIAL ===== */
window.addEventListener("DOMContentLoaded", loadPosts);
