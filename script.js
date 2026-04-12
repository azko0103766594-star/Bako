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
window.handlePublish = () => upload.click();


// 🔄 récupérer posts depuis worker
async function loadPosts() {
  try {
    const res = await fetch(API + "/", { method: "GET" });

    if (!res.ok) {
      console.error("Erreur GET posts:", res.status);
      feed.innerHTML = "<p>Erreur serveur ❌</p>";
      return;
    }

    const data = await res.json();

    // si ton worker renvoie directement un tableau
    if (Array.isArray(data)) {
      posts = data;
    }
    // si ton worker renvoie {posts: [...]}
    else if (data.posts) {
      posts = data.posts;
    }
    else {
      posts = [];
    }

    renderFeed();
  } catch (err) {
    console.error("Erreur loadPosts:", err);
    feed.innerHTML = "<p>Erreur serveur ❌</p>";
  }
}


// 🖼️ afficher feed
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
        <span>❤️ ${(post.likes || []).length}</span>
        <span>💬 ${(post.comments || []).length}</span>
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


// 📤 upload image
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
      console.error("Upload error:", data);
      alert("Erreur upload ❌");
      return;
    }

    // reload posts après upload
    await loadPosts();

  } catch (err) {
    console.error("Erreur upload:", err);
    alert("Erreur serveur ❌");
  }

  upload.value = "";
});


// ❤️ like/dislike
window.toggleLike = async (postId) => {
  try {
    const res = await fetch(API + "/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, userId })
    });

    if (!res.ok) {
      console.error("Erreur like:", res.status);
      return;
    }

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

  commentList.innerHTML = (post.comments || []).length
    ? post.comments.map(c => `<p>💬 ${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}


// 📩 ajouter commentaire
window.submitComment = async () => {
  const text = commentInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch(API + "/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: currentPostId,
        text,
        userId
      })
    });

    if (!res.ok) {
      console.error("Erreur commentaire:", res.status);
      alert("Erreur commentaire ❌");
      return;
    }

    commentInput.value = "";
    await loadPosts();
    renderComments();

  } catch (err) {
    console.error("Erreur commentaire:", err);
    alert("Erreur serveur ❌");
  }
};


// ❌ fermer commentaires
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};


// 🚀 init
loadPosts();
