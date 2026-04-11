const API = "https://cool-forest-3f3e.jdjdurirjrrj2.workers.dev";

const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let currentPostId = null;

const userId = "user_" + Math.random().toString(36).slice(2);

// ================= LOAD POSTS =================
async function loadPosts() {
  const res = await fetch(API + "/posts");
  const posts = await res.json();

  renderFeed(posts);
}

// ================= UPLOAD =================
window.handlePublish = () => upload.click();

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    // 1. upload image
    const res = await fetch(API + "/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    // 2. save post in DB
    await fetch(API + "/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: data.url })
    });

    loadPosts();

  } catch (err) {
    console.log(err);
    alert("Upload échoué ❌ (Worker ou R2)");
  }

  upload.value = "";
});

// ================= RENDER FEED =================
function renderFeed(posts) {
  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "card";

    const likes = JSON.parse(post.likes || "[]");
    const comments = JSON.parse(post.comments || "[]");

    div.innerHTML = `
      <img src="${post.url}" />

      <div style="display:flex; justify-content:space-between;">
        <span>❤️ ${likes.length}</span>
        <span>💬 ${comments.length}</span>
      </div>

      <div style="display:flex; gap:5px;">
        <button onclick="toggleLike(${post.id})">Like</button>
        <button onclick="openComments(${post.id})">Commenter</button>
      </div>
    `;

    feed.appendChild(div);
  });
}

// ================= LIKE =================
window.toggleLike = async (id) => {
  await fetch(API + "/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, userId })
  });

  loadPosts();
};

// ================= COMMENTS =================
window.openComments = async (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

async function renderComments() {
  const res = await fetch(API + "/posts");
  const posts = await res.json();

  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  const comments = JSON.parse(post.comments || "[]");

  commentList.innerHTML = comments.length
    ? comments.map(c => `<p>💬 ${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}

window.submitComment = async () => {
  const text = commentInput.value.trim();
  if (!text) return;

  await fetch(API + "/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: currentPostId,
      text
    })
  });

  commentInput.value = "";
  renderComments();
  loadPosts();
};

window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// ================= INIT =================
loadPosts();
