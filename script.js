const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

const API = "https://ton-worker.workers.dev";

// 👤 user unique
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).slice(2);
  localStorage.setItem("userId", userId);
}

let posts = [];
let currentPostId = null;

// ---------------------------
// 📥 CHARGER LES POSTS
// ---------------------------
async function loadPosts() {
  try {
    const res = await fetch(`${API}/posts`);
    posts = await res.json();
    renderFeed();
  } catch (err) {
    console.error("Erreur load posts:", err);
  }
}

// ---------------------------
// 📤 UPLOAD IMAGE
// ---------------------------
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    await fetch(`${API}/upload`, {
      method: "POST",
      body: formData
    });

    upload.value = "";
    loadPosts();
  } catch (err) {
    console.error("Upload error:", err);
  }
});

// ---------------------------
// ❤️ LIKE / DISLIKE
// ---------------------------
window.toggleLike = async (postId) => {
  try {
    await fetch(`${API}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        userId
      })
    });

    loadPosts();
  } catch (err) {
    console.error("Like error:", err);
  }
};

// ---------------------------
// 💬 OUVRIR COMMENTAIRES
// ---------------------------
window.openComments = (postId) => {
  currentPostId = postId;
  commentOverlay.style.display = "flex";
  renderComments();
};

// ---------------------------
// 💬 AFFICHER COMMENTAIRES
// ---------------------------
function renderComments() {
  const post = posts.find(p => p.id == currentPostId);
  if (!post) return;

  if (!post.comments || post.comments.length === 0) {
    commentList.innerHTML = "<p>Aucun commentaire</p>";
    return;
  }

  commentList.innerHTML = post.comments
    .map(c => `<p>💬 ${c.text}</p>`)
    .join("");
}

// ---------------------------
// 📩 ENVOYER COMMENTAIRE
// ---------------------------
window.submitComment = async () => {
  const text = commentInput.value.trim();
  if (!text || !currentPostId) return;

  try {
    await fetch(`${API}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: currentPostId,
        userId,
        text
      })
    });

    commentInput.value = "";
    loadPosts();
    renderComments();
  } catch (err) {
    console.error("Comment error:", err);
  }
};

// ---------------------------
// ❌ FERMER COMMENTAIRES
// ---------------------------
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// ---------------------------
// 🖼️ AFFICHER FEED
// ---------------------------
function renderFeed() {
  feed.innerHTML = "";

  if (!posts || posts.length === 0) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${post.image_url}" style="width:100%; border-radius:10px;" />

      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <span>❤️ ${post.likes_count || 0}</span>
        <span>💬 ${post.comments_count || 0}</span>
      </div>

      <div style="margin-top:10px; display:flex; gap:5px;">
        <button onclick="toggleLike(${post.id})">
          ❤️ Like
        </button>

        <button onclick="openComments(${post.id})">
          💬 Commenter
        </button>
      </div>
    `;

    feed.appendChild(div);
  });
}

// ---------------------------
// 🚀 INIT
// ---------------------------
loadPosts();
