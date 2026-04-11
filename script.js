// =======================
// 🔗 CONFIG
// =======================
const API = "https://tiny-darkness-219d.jdjdurirjrrj2.workers.dev";

// =======================
// 📦 ELEMENTS DOM
// =======================
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

// =======================
// 👤 USER LOCAL UNIQUE
// =======================
const userId =
  localStorage.getItem("mini_user") ||
  (() => {
    const id = "user_" + Math.random().toString(36).slice(2);
    localStorage.setItem("mini_user", id);
    return id;
  })();

// =======================
// 📥 DATA
// =======================
let posts = [];
let currentPostId = null;

// =======================
// 🚀 INIT
// =======================
document.addEventListener("DOMContentLoaded", loadPosts);

// =======================
// 📥 LOAD POSTS
// =======================
async function loadPosts() {
  try {
    const res = await fetch(`${API}/posts`);
    posts = await res.json();
    renderFeed();
  } catch (err) {
    feed.innerHTML = "<p>Erreur serveur ⚠️</p>";
  }
}

// =======================
// 📤 BOUTON PUBLIER
// =======================
window.handlePublish = () => {
  upload.click();
};

// =======================
// 📤 UPLOAD IMAGE
// =======================
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("userId", userId);

  try {
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData,
    });

    const newPost = await res.json();
    posts.unshift(newPost);
    renderFeed();
  } catch (err) {
    alert("Erreur upload ❌");
  }

  upload.value = "";
});

// =======================
// 🖼️ RENDER FEED
// =======================
function renderFeed() {
  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement("div");
    card.className = "card";

    const liked = post.likes?.includes(userId);

    card.innerHTML = `
      <img src="${post.url}" class="post-image"/>

      <div class="post-stats">
        <span>❤️ ${post.likes?.length || 0}</span>
        <span>💬 ${post.comments?.length || 0}</span>
      </div>

      <div class="post-actions">
        <button onclick="toggleLike('${post.id}')">
          ${liked ? "Dislike" : "Like"}
        </button>

        <button onclick="openComments('${post.id}')">
          Commenter
        </button>
      </div>
    `;

    feed.appendChild(card);
  });
}

// =======================
// ❤️ LIKE
// =======================
window.toggleLike = async (id) => {
  try {
    await fetch(`${API}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id, userId }),
    });

    await loadPosts();
  } catch (err) {
    alert("Erreur like ❌");
  }
};

// =======================
// 💬 OPEN COMMENTS
// =======================
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

// =======================
// 💬 RENDER COMMENTS
// =======================
function renderComments() {
  const post = posts.find((p) => p.id == currentPostId);
  if (!post) return;

  commentList.innerHTML = "";

  if (!post.comments || post.comments.length === 0) {
    commentList.innerHTML = "<p>Aucun commentaire</p>";
    return;
  }

  post.comments.forEach((c) => {
    const p = document.createElement("p");
    p.textContent = "💬 " + c;
    commentList.appendChild(p);
  });
}

// =======================
// 📩 ADD COMMENT
// =======================
window.submitComment = async () => {
  const text = commentInput.value.trim();
  if (!text) return;

  try {
    await fetch(`${API}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: currentPostId,
        text,
      }),
    });

    commentInput.value = "";
    await loadPosts();
    renderComments();
  } catch (err) {
    alert("Erreur commentaire ❌");
  }
};

// =======================
// ❌ CLOSE COMMENTS
// =======================
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};
