const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentCommentId = null;

// 🔥 ID utilisateur simple
const userId = "user_" + Math.random().toString(36).slice(2);

// 🔥 TON WORKER (UPLOAD UNIQUEMENT)
const WORKER_URL = "https://twilight-voice-0a28.bazayyayzyay.workers.dev";

// ouvrir sélection image
window.handlePublish = () => {
  upload.click();
};

// upload image vers worker
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("Erreur upload");
    }

    const data = await res.json();

    if (!data.url) {
      throw new Error("URL manquante");
    }

    // ✅ nouveau post
    const newPost = {
      id: Date.now(),
      url: data.url, // 🔥 vient du worker
      likes: [],
      comments: []
    };

    posts.unshift(newPost);
    save();
    renderFeed();

    upload.value = "";

  } catch (err) {
    console.error(err);
    alert("Erreur upload ❌");
  }
});

// sauvegarde local
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// afficher feed
function renderFeed() {
  feed.innerHTML = "";

  if (posts.length === 0) {
    feed.innerHTML = "<p>Aucune image</p>";
    return;
  }

  posts.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${p.url}" style="max-width:100%; border-radius:10px;">
      
      <p>❤️ ${p.likes.length} | 💬 ${p.comments.length}</p>

      <button onclick="toggleLike(${p.id})">
        ${p.likes.includes(userId) ? "Dislike" : "Like"}
      </button>

      <button onclick="openComments(${p.id})">
        Commenter
      </button>
    `;

    feed.appendChild(div);
  });
}

// like
window.toggleLike = (id) => {
  const post = posts.find(p => p.id == id);
  if (!post) return;

  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(x => x !== userId);
  } else {
    post.likes.push(userId);
  }

  save();
  renderFeed();
};

// ouvrir commentaires
window.openComments = (id) => {
  currentCommentId = id;
  updateComments();
  commentOverlay.style.display = "flex";
};

// afficher commentaires
function updateComments() {
  const post = posts.find(p => p.id == currentCommentId);
  if (!post) return;

  commentList.innerHTML = post.comments
    .map(c => `<p>${c}</p>`)
    .join("");
}

// envoyer commentaire
window.submitComment = () => {
  const text = commentInput.value.trim();
  if (!text) return;

  const post = posts.find(p => p.id == currentCommentId);
  if (!post) return;

  post.comments.push(text);

  commentInput.value = "";
  save();
  updateComments();
  renderFeed();
};

// fermer commentaires
window.closeComments = () => {
  commentOverlay.style.display = "none";
};

// init
renderFeed();
