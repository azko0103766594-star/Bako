const API = "https://cool-forest-3f3e.jdjdurirjrrj2.workers.dev";

const feed = document.getElementById("feed");
const fileInput = document.getElementById("file");
const commentBox = document.getElementById("commentBox");
const commentsDiv = document.getElementById("comments");
const commentInput = document.getElementById("commentInput");

let currentPost = null;

// 👤 user unique
const userId = "user_" + Math.random().toString(36).slice(2);

// =========================
// 📤 UPLOAD
// =========================
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API + "/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  await fetch(API + "/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: data.url })
  });

  loadPosts();
});

// =========================
// 📦 LOAD POSTS
// =========================
async function loadPosts() {
  const res = await fetch(API + "/posts");
  const posts = await res.json();

  feed.innerHTML = "";

  posts.forEach(post => {
    const likes = JSON.parse(post.likes || "[]");
    const comments = JSON.parse(post.comments || "[]");

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${post.url}">
      <p>❤️ ${likes.length} 💬 ${comments.length}</p>

      <button onclick="like(${post.id})">Like</button>
      <button onclick="openComments(${post.id}, '${post.comments}')">Comment</button>
    `;

    feed.appendChild(div);
  });
}

// =========================
// ❤️ LIKE
// =========================
async function like(id) {
  await fetch(API + "/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, userId })
  });

  loadPosts();
}

// =========================
// 💬 COMMENTS
// =========================
function openComments(id, comments) {
  currentPost = id;
  commentBox.classList.remove("hidden");

  try {
    const list = JSON.parse(comments || "[]");
    commentsDiv.innerHTML = list.map(c => `<p>💬 ${c}</p>`).join("");
  } catch {
    commentsDiv.innerHTML = "";
  }
}

async function sendComment() {
  const text = commentInput.value;
  if (!text) return;

  await fetch(API + "/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: currentPost,
      text
    })
  });

  commentInput.value = "";
  loadPosts();
}

function closeComments() {
  commentBox.classList.add("hidden");
}

// INIT
loadPosts();
