const API = "https://tight-firefly-5f1d.jdjdurirjrrj2.workers.dev";

const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const publishBtn = document.getElementById("publishBtn");

const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const closeComment = document.getElementById("closeComment");
const sendComment = document.getElementById("sendComment");

let posts = [];
let currentPostId = null;

// 👤 user local
const userId = "user_" + Math.random().toString(36).slice(2);

// =========================
// 📤 OUVRIR UPLOAD (FIX MOBILE)
// =========================
publishBtn.addEventListener("click", () => {
  setTimeout(() => {
    upload.click();
  }, 100);
});

// =========================
// 📤 UPLOAD IMAGE → R2
// =========================
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    await fetch(`${API}/upload`, {
      method: "POST",
      body: formData
    });

    upload.value = "";
    loadPosts();
  } catch (err) {
    alert("Erreur upload ❌");
    console.log(err);
  }
});

// =========================
// 📥 CHARGER POSTS
// =========================
async function loadPosts() {
  try {
    const res = await fetch(`${API}/posts`);
    posts = await res.json();
    renderFeed();
  } catch (err) {
    console.log("Erreur load posts", err);
  }
}

// =========================
// 🖼️ AFFICHER FEED
// =========================
function renderFeed() {
  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${post.url}" />

      <div class="actions">
        <span>❤️ ${post.likes.length} 💬 ${post.comments.length}</span>

        <div>
          <button onclick="likePost('${post.id}')">
            ${post.likes.includes(userId) ? "Dislike" : "Like"}
          </button>

          <button onclick="openComments('${post.id}')">
            Commenter
          </button>
        </div>
      </div>
    `;

    feed.appendChild(div);
  });
}

// =========================
// ❤️ LIKE / DISLIKE
// =========================
window.likePost = async (id) => {
  await fetch(`${API}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId: id, userId })
  });

  loadPosts();
};

// =========================
// 💬 COMMENTAIRES
// =========================
window.openComments = (id) => {
  currentPostId = id;
  commentOverlay.style.display = "flex";
  renderComments();
};

function renderComments() {
  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;

  commentList.innerHTML = post.comments.length
    ? post.comments.map(c => `<p>${c}</p>`).join("")
    : "<p>Aucun commentaire</p>";
}

// =========================
// 📩 ENVOYER COMMENTAIRE
// =========================
sendComment.addEventListener("click", async () => {
  const text = commentInput.value.trim();
  if (!text) return;

  await fetch(`${API}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postId: currentPostId,
      text
    })
  });

  commentInput.value = "";
  loadPosts();
  renderComments();
});

// =========================
// ❌ FERMER COMMENTAIRES
// =========================
closeComment.addEventListener("click", () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
});

// =========================
// 🚀 INIT APP
// =========================
loadPosts();
