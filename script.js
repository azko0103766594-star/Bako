const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

const API = "https://tiny-darkness-219d.jdjdurirjrrj2.workers.dev";

// 👤 user unique local
const userId = "user_" + Math.random().toString(36).slice(2);

// 📥 posts depuis D1
let posts = [];
let currentPostId = null;

// 🚀 init
loadPosts();

// =======================
// 📥 CHARGER POSTS (D1 + R2)
// =======================
async function loadPosts() {
  const res = await fetch(`${API}/posts`);
  posts = await res.json();
  renderFeed();
}

// =======================
// 📤 UPLOAD IMAGE (R2)
// =======================
window.handlePublish = () => upload.click();

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("userId", userId);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    body: formData
  });

  const newPost = await res.json();

  posts.unshift(newPost);
  renderFeed();

  upload.value = "";
});

// =======================
// 🖼️ AFFICHER FEED
// =======================
function renderFeed() {
  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${post.url}" style="width:100%; border-radius:10px;" />

      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <span>❤️ ${post.likes?.length || 0}</span>
        <span>💬 ${post.comments?.length || 0}</span>
      </div>

      <div style="margin-top:10px; display:flex; gap:5px;">
        <button onclick="toggleLike('${post.id}')">
          ${post.likes?.includes(userId) ? "Dislike" : "Like"}
        </button>

        <button onclick="openComments('${post.id}')">
          Commenter
        </button>
      </div>
    `;

    feed.appendChild(div);
  });
}

// =======================
// ❤️ LIKE / DISLIKE (D1)
// =======================
window.toggleLike = async (id) => {
  await fetch(`${API}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId: id, userId })
  });

  await loadPosts();
};

// =======================
// 💬 OUVRIR COMMENTAIRES
// =======================
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

// =======================
// 💬 AFFICHER COMMENTAIRES
// =======================
function renderComments() {
  const post = posts.find(p => p.id == currentPostId);
  if (!post) return;

  commentList.innerHTML = post.comments?.length
    ? post.comments.map(c => `<p>💬 ${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}

// =======================
// 📩 AJOUT COMMENTAIRE (D1)
// =======================
window.submitComment = async () => {
  const text = commentInput.value.trim();
  if (!text) return;

  await fetch(`${API}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postId: currentPostId,
      text
    })
  });

  commentInput.value = "";

  await loadPosts();
  renderComments();
};

// =======================
// ❌ FERMER
// =======================
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};
