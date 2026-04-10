const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentPostId = null;

// 👤 user unique (local)
const userId = "user_" + Math.random().toString(36).slice(2);

// 📤 ouvrir upload
window.handlePublish = () => upload.click();

// 📤 créer post (SANS Worker)
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 🔥 image locale temporaire
  const imageUrl = URL.createObjectURL(file);

  const newPost = {
    id: Date.now(),
    url: imageUrl,
    likes: [],
    comments: []
  };

  posts.unshift(newPost);
  save();
  renderFeed();

  upload.value = "";
});

// 💾 sauvegarde
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// 🖼️ AFFICHAGE FEED
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
      <img src="${post.url}" style="width:100%; border-radius:10px;">

      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <span>❤️ ${post.likes.length}</span>
        <span>💬 ${post.comments.length}</span>
      </div>

      <div style="margin-top:10px; display:flex; gap:5px;">
        <button onclick="toggleLike(${post.id})">
          ${post.likes.includes(userId) ? "Dislike" : "Like"}
        </button>

        <button onclick="openComments(${post.id})">
          Commenter
        </button>
      </div>
    `;

    feed.appendChild(div);
  });
}

// ❤️ LIKE / DISLIKE
window.toggleLike = (id) => {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(u => u !== userId);
  } else {
    post.likes.push(userId);
  }

  save();
  renderFeed();
};

// 💬 OUVRIR COMMENTAIRES
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

// 💬 AFFICHER COMMENTAIRES
function renderComments() {
  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  commentList.innerHTML = post.comments.length
    ? post.comments.map(c => `<p>💬 ${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}

// 📩 ENVOYER COMMENTAIRE
window.submitComment = () => {
  const text = commentInput.value.trim();
  if (!text) return;

  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  post.comments.push(text);

  commentInput.value = "";
  save();
  renderComments();
  renderFeed();
};

// ❌ FERMER COMMENTAIRES
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// 🚀 INIT
renderFeed();
