const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

// 📦 load posts
let posts = JSON.parse(localStorage.getItem("posts")) || [];

// 👤 user id
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Date.now();
  localStorage.setItem("userId", userId);
}

let currentPostId = null;

// 📤 ouvrir upload
window.handlePublish = () => upload.click();

// 💾 save
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// 🧹 clean (évite images cassées)
function cleanPosts() {
  posts = posts.filter(p => p && p.url && typeof p.url === "string");
}
cleanPosts();

// 📤 ajouter post (ICI tu mets TON URL R2)
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // ⚠️ IMPORTANT :
  // ici on suppose que TU récupères déjà une URL R2 ailleurs
  // donc pour test simple on utilise FileReader MAIS tu peux remplacer

  const reader = new FileReader();

  reader.onload = function(event) {
    const newPost = {
      id: Date.now(),
      url: event.target.result, // ⚠️ remplace par URL R2 quand prêt
      likes: [],
      comments: []
    };

    posts.unshift(newPost);
    save();
    renderFeed();
  };

  reader.readAsDataURL(file);
  upload.value = "";
});

// 🖼️ AFFICHER FEED
function renderFeed() {
  feed.innerHTML = "";

  if (posts.length === 0) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <img src="${post.url}" style="width:100%; border-radius:10px;">

      <p>❤️ ${post.likes.length} | 💬 ${post.comments.length}</p>

      <button onclick="toggleLike(${post.id})">
        ${post.likes.includes(userId) ? "Dislike" : "Like"}
      </button>

      <button onclick="openComments(${post.id})">
        Commenter
      </button>
    `;

    feed.appendChild(div);
  });
}

// ❤️ LIKE
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

// 💬 OPEN COMMENTS
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

// 💬 SHOW COMMENTS
function renderComments() {
  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  commentList.innerHTML = "";

  if (post.comments.length === 0) {
    commentList.innerHTML = "<p>Aucun commentaire</p>";
    return;
  }

  post.comments.forEach(c => {
    const p = document.createElement("p");
    p.textContent = "💬 " + c;
    commentList.appendChild(p);
  });
}

// 📩 COMMENT
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

// ❌ CLOSE
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// 🚀 INIT
renderFeed();
