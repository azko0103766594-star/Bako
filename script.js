const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

const API = "https://tiny-darkness-219d.jdjdurirjrrj2.workers.dev";

let posts = [];
let currentPostId = null;

// 👤 user unique
const userId = "user_" + Math.random().toString(36).slice(2);

// 📤 ouvrir upload
window.handlePublish = () => {
  upload.click();
};

// 🔄 charger posts depuis Worker
async function loadPosts() {
  try {
    const res = await fetch(API + "/posts");
    const data = await res.json();

    posts = data.posts || [];
    renderFeed();
  } catch (err) {
    console.error("Erreur load posts:", err);
    feed.innerHTML = "<p>Erreur serveur ❌</p>";
  }
}

// 📤 upload image vers Worker
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(API + "/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.url) {
      console.error("Upload failed:", data);
      alert("Erreur upload ❌");
      return;
    }

    // Après upload → recharge les posts depuis worker
    await loadPosts();

  } catch (err) {
    console.error("Server error:", err);
    alert("Erreur serveur ❌");
  }

  upload.value = "";
});

// 🖼️ afficher feed
function renderFeed() {
  feed.innerHTML = "";

  if (posts.length === 0) {
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
        <button onclick="toggleLike(${post.id})">
          ${(post.likes || []).includes(userId) ? "Dislike" : "Like"}
        </button>

        <button onclick="openComments(${post.id})">
          Commenter
        </button>
      </div>
    `;

    feed.appendChild(div);
  });
}

// ❤️ like / dislike (Worker)
window.toggleLike = async (id) => {
  try {
    await fetch(API + "/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id, userId })
    });

    await loadPosts();
  } catch (err) {
    console.error("Erreur like:", err);
  }
};

// 💬 ouvrir commentaires
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

// 💬 afficher commentaires
function renderComments() {
  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  commentList.innerHTML = post.comments?.length
    ? post.comments.map(c => `<p>💬 ${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}

// 📩 ajouter commentaire (Worker)
window.submitComment = async () => {
  const text = commentInput.value.trim();
  if (!text) return;

  try {
    await fetch(API + "/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: currentPostId,
        text,
        userId
      })
    });

    commentInput.value = "";
    await loadPosts();
    renderComments();

  } catch (err) {
    console.error("Erreur commentaire:", err);
  }
};

// ❌ fermer commentaires
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// 🚀 init
loadPosts();
