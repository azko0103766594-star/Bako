const API = "https://cool-forest-3f3e.jdjdurirjrrj2.workers.dev";

const feed = document.getElementById("feed");
const upload = document.getElementById("upload");

let posts = [];
let currentPostId = null;

const userId = "user_" + Math.random().toString(36).slice(2);

// ================= UPLOAD =================
window.handlePublish = () => upload.click();

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();

  // 🔥 DOIT être "file" (comme ton Worker)
  formData.append("file", file);

  try {
    const res = await fetch(API + "/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.url) {
      alert("Upload échoué ❌ (pas d'URL retour)");
      return;
    }

    // 🔥 envoi post au Worker / DB
    await fetch(API + "/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: data.url })
    });

    loadPosts();

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    alert("Upload échoué ❌ Worker ou R2");
  }

  upload.value = "";
});

// ================= LOAD POSTS =================
async function loadPosts() {
  try {
    const res = await fetch(API + "/posts");
    posts = await res.json();
    renderFeed();
  } catch (err) {
    console.log("LOAD ERROR:", err);
  }
}

// ================= RENDER =================
function renderFeed() {
  feed.innerHTML = "";

  if (!posts.length) {
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

      <div style="display:flex; justify-content:space-between;">
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
  await fetch(API + "/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, userId })
  });

  loadPosts();
};

// ================= COMMENTS =================
window.openComments = (id) => {
  currentPostId = id;
  document.getElementById("commentOverlay").style.display = "flex";
};

window.submitComment = async () => {
  const text = document.getElementById("commentInput").value.trim();
  if (!text) return;

  await fetch(API + "/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: currentPostId, text })
  });

  document.getElementById("commentInput").value = "";
  loadPosts();
};

window.closeComments = () => {
  document.getElementById("commentOverlay").style.display = "none";
  currentPostId = null;
};

// ================= INIT =================
loadPosts();
