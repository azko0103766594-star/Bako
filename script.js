const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentCommentId = null;
const userId = "user_" + Math.random().toString(36).slice(2);

// 🔥 URL DE TON WORKER (REMPLACE ICI)
const WORKER_URL = "https://TON-WORKER.workers.dev";

// ouvrir fichier
window.handlePublish = () => upload.click();

// upload vers Cloudflare Worker
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
      throw new Error("Upload failed");
    }

    const data = await res.json();

    if (!data.url) {
      throw new Error("No URL returned");
    }

    const newPost = {
      id: Date.now(),
      url: data.url,
      likes: [],
      comments: []
    };

    posts.unshift(newPost);
    save();
    renderFeed();

    // 🧹 reset input (important)
    upload.value = "";

  } catch (err) {
    console.error(err);
    alert("Erreur upload ❌");
  }
});

// sauvegarde
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// affichage feed
function renderFeed() {
  feed.innerHTML = "";

  if (!posts.length) {
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
  const p = posts.find(x => x.id == id);
  if (!p) return;

  if (p.likes.includes(userId)) {
    p.likes = p.likes.filter(x => x !== userId);
  } else {
    p.likes.push(userId);
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
  const p = posts.find(x => x.id == currentCommentId);
  if (!p) return;

  commentList.innerHTML = p.comments
    .map(c => `<p>${c}</p>`)
    .join("");
}

// envoyer commentaire
window.submitComment = () => {
  const txt = commentInput.value.trim();
  if (!txt) return;

  const p = posts.find(x => x.id == currentCommentId);
  if (!p) return;

  p.comments.push(txt);

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