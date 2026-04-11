const API = "https://cool-forest-3f3e.jdjdurirjrrj2.workers.dev";

const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentPostId = null;

const userId = "user_" + Math.random().toString(36).slice(2);

// ================= UPLOAD =================
window.handlePublish = () => {
  upload.click();
};

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();

  // 🔥 IMPORTANT: doit s'appeler "file" (ton worker)
  formData.append("file", file);

  try {
    const res = await fetch(API + "/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    const newPost = {
      id: Date.now(),
      url: data.url,
      likes: [],
      comments: []
    };

    posts.unshift(newPost);
    save();
    renderFeed();

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    alert("Upload échoué ❌");
  }

  upload.value = "";
});

// ================= SAVE =================
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// ================= FEED =================
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
      <img src="${post.url}" />

      <div style="display:flex; justify-content:space-between;">
        <span>❤️ ${post.likes.length}</span>
        <span>💬 ${post.comments.length}</span>
      </div>

      <div style="display:flex; gap:5px; margin-top:10px;">
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

// ================= LIKE =================
window.toggleLike = async (id) => {
  const res = await fetch(API + "/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, userId })
  });

  const data = await res.json();

  const post = posts.find(p => p.id === id);
  if (post) post.likes = data.likes;

  save();
  renderFeed();
};

// ================= COMMENTS =================
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

  const post = posts.find(p => p.id === currentPostId);
  if (post) post.comments.push(text);

  commentInput.value = "";
  save();
  renderComments();
  renderFeed();
};

window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// ================= INIT =================
renderFeed();
