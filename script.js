const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

// 🔥 TON WORKER ICI (CHANGE JUSTE CETTE LIGNE SI BESOIN)
const WORKER_URL = "https://twilight-voice-0a28.bazayyayzyay.workers.dev";

let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentPostId = null;

const userId = "user_" + Math.random().toString(36).slice(2);

// 📤 ouvrir upload
window.handlePublish = () => upload.click();

// 📤 upload image vers Worker + R2
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

    const data = await res.json();

    if (!data.url) throw new Error("Upload failed");

    const newPost = {
      id: Date.now(),
      url: data.url,
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

// 💾 save localStorage
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// 🖼️ afficher feed
function renderFeed() {
  feed.innerHTML = "";

  if (posts.length === 0) {
    feed.innerHTML = "<p>Aucune image</p>";
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

// ❤️ like / dislike
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

// 💬 open comments
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

// 💬 render comments
function renderComments() {
  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  commentList.innerHTML = post.comments
    .map(c => `<p>💬 ${c}</p>`)
    .join("");
}

// 📩 send comment
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

// ❌ close comments
window.closeComments = () => {
  commentOverlay.style.display = "none";
};

// 🚀 init
renderFeed();
