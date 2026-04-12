const API = "https://cool-forest-3f3e.jdjdurirjrrj2.workers.dev";

const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

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

  // ⚠️ DOIT être "file" (TON WORKER)
  formData.append("file", file);

  try {
    const res = await fetch(API + "/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.url) {
      alert("Upload échoué ❌ (pas d’URL)");
      return;
    }

    // sauvegarde dans D1
    await fetch(API + "/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: data.url })
    });

    loadPosts();

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    alert("Upload échoué ❌ Worker ou R2");
  }

  upload.value = "";
});

// ================= LOAD POSTS =================
async function loadPosts() {
  try {
    const res = await fetch(API + "/posts");
    const posts = await res.json();
    renderFeed(posts);
  } catch (err) {
    console.log("LOAD ERROR:", err);
  }
}

// ================= FEED =================
function renderFeed(posts) {
  feed.innerHTML = "";

  if (!posts || posts.length === 0) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach(post => {
    const likes = JSON.parse(post.likes || "[]");
    const comments = JSON.parse(post.comments || "[]");

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${post.url}" />

      <div style="display:flex; justify-content:space-between; margin:5px 0;">
        <span>❤️ ${likes.length}</span>
        <span>💬 ${comments.length}</span>
      </div>

      <div style="display:flex; gap:5px;">
        <button onclick="likePost(${post.id})">Like</button>
        <button onclick="openComments(${post.id})">Commenter</button>
      </div>
    `;

    feed.appendChild(div);
  });
}

// ================= LIKE =================
window.likePost = async (id) => {
  try {
    await fetch(API + "/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId })
    });

    loadPosts();
  } catch (err) {
    console.log(err);
  }
};

// ================= COMMENTS =================
window.openComments = async (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  await loadComments();
};

async function loadComments() {
  const res = await fetch(API + "/posts");
  const posts = await res.json();

  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  const comments = JSON.parse(post.comments || "[]");

  commentList.innerHTML = comments.length
    ? comments.map(c => `<p>💬 ${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}

// ================= ADD COMMENT =================
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
  loadPosts();
  loadComments();
};

// ================= CLOSE COMMENTS =================
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// ================= INIT =================
loadPosts();
