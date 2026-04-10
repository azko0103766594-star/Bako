const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

// 📦 Load posts safe
let posts = [];
try {
  posts = JSON.parse(localStorage.getItem("posts")) || [];
} catch (e) {
  posts = [];
}

// 👤 user unique
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + crypto.randomUUID();
  localStorage.setItem("userId", userId);
}

let currentPostId = null;

// 🧹 CLEAN POSTS (IMPORTANT)
function cleanPosts() {
  posts = posts.filter(p =>
    p &&
    typeof p.url === "string" &&
    p.url.startsWith("http") // ✅ R2 only
  );
}
cleanPosts();

// 💾 SAVE
function save() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// 📤 BUTTON UPLOAD
window.handlePublish = () => upload.click();

// 🚀 UPLOAD IMAGE (R2 VERSION)
async function uploadToR2(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/upload", {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Upload failed");

  const data = await res.json();
  return data.url; // 👉 URL R2
}

// 📤 CREATE POST
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const url = await uploadToR2(file);

    const newPost = {
      id: crypto.randomUUID(),
      url: url,
      likes: [],
      comments: []
    };

    posts.unshift(newPost);
    save();
    renderFeed();

  } catch (err) {
    console.error("Upload error:", err);
    alert("Erreur upload image");
  }

  upload.value = "";
});

// 🖼️ RENDER FEED
function renderFeed() {
  feed.innerHTML = "";

  if (posts.length === 0) {
    feed.innerHTML = "<p>Aucune publication 📭</p>";
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post";

    const img = document.createElement("img");
    img.src = post.url;
    img.alt = "post image";

    // ❌ fallback si image cassée
    img.onerror = () => {
      img.src = "https://via.placeholder.com/400?text=Image+indisponible";
    };

    const info = document.createElement("div");
    info.innerHTML = `
      <p>❤️ ${post.likes.length} | 💬 ${post.comments.length}</p>

      <button onclick="toggleLike('${post.id}')">
        ${post.likes.includes(userId) ? "Dislike" : "Like"}
      </button>

      <button onclick="openComments('${post.id}')">
        Commenter
      </button>
    `;

    div.appendChild(img);
    div.appendChild(info);

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

// 💬 RENDER COMMENTS
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

// 📩 SEND COMMENT
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

// ❌ CLOSE COMMENTS
window.closeComments = () => {
  commentOverlay.style.display = "none";
  currentPostId = null;
};

// 🚀 INIT
renderFeed();
