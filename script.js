const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

// 🔥 TON BUCKET R2
const R2_BASE_URL = "https://pub-fb69105f2e6b47f28bda893593284762.r2.dev/";

let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentPostId = null;

const userId = "user_" + Math.random().toString(36).slice(2);

// 📤 ouvrir upload
window.handlePublish = () => upload.click();

/* 
====================================================
📤 IMPORTANT
👉 Ici on SIMULE upload R2
👉 (plus tard tu brancheras vrai upload Worker)
====================================================
*/
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 🧠 on crée un nom unique
  const fileName = Date.now() + "_" + file.name;

  // 🔥 IMPORTANT : ici on suppose que l’image est déjà uploadée dans R2
  const imageUrl = R2_BASE_URL + fileName;

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

// 💾 save
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// 🖼️ FEED
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

// 💬 COMMENTS
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

function renderComments() {
  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  commentList.innerHTML = post.comments.length
    ? post.comments.map(c => `<p>💬 ${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}

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

window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// 🚀 INIT
renderFeed();
