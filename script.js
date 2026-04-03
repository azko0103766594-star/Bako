/* ===== IDENTITE UTILISATEUR (1 navigateur = 1 user) ===== */
let userId = localStorage.getItem("userId");
if(!userId){
  userId = "user_" + Math.random().toString(36).substr(2,9);
  localStorage.setItem("userId", userId);
}

/* ===== DATA ===== */
let photos = [];
const feed = document.getElementById("feed");

/* ===== AFFICHER LES POSTS ===== */
function render() {
  feed.innerHTML = "";

  if (photos.length === 0) {
    feed.innerHTML = '<div class="empty">Aucune image pour le moment</div>';
    return;
  }

  photos.forEach((p) => {
    const liked = p.likesUsers.includes(userId);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.url}" alt="${p.title}">
      
      <div class="actions">
        <span>❤️ ${p.likesUsers.length} | 👁️ ${p.viewsUsers.length}</span>
        <button class="like-btn" onclick="toggleLike('${p.id}')">
          ${liked ? "Dislike" : "Like"}
        </button>
      </div>

      <div style="padding:10px">
        <div id="comments-${p.id}">
          ${p.comments.map(c => `<p>💬 ${c.username}: ${c.content}</p>`).join("")}
        </div>

        <input 
          id="input-${p.id}" 
          placeholder="Écrire un commentaire..." 
          style="width:70%;padding:6px;border-radius:10px;border:1px solid #ccc">

        <button onclick="addComment('${p.id}')">Envoyer</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

/* ===== CHARGER TOUS LES POSTS ===== */
async function loadPosts() {
  try {
    const res = await fetch("https://ton-worker.example.workers.dev/posts");
    const posts = await res.json();

    photos = posts.map(p => ({
      id: p.id,
      title: p.title,
      url: p.image_url,
      likesUsers: Array(p.likes || 0).fill("user_placeholder"),
      viewsUsers: Array(p.views || 0).fill("user_placeholder"),
      comments: p.comments || []
    }));

    render();
  } catch (err) {
    console.error("Erreur lors du chargement des posts:", err);
  }
}

/* ===== PUBLISH IMAGE ===== */
document.getElementById("upload").addEventListener("change", async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function() {
    const data = { title: "Nouvelle image", image_url: reader.result };

    try {
      await fetch("https://ton-worker.example.workers.dev/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      await loadPosts();
    } catch (err) {
      console.error("Erreur lors de la publication:", err);
    }
  };
  reader.readAsDataURL(file);
});

/* ===== LIKE / DISLIKE ===== */
async function toggleLike(postId) {
  try {
    await fetch(`https://ton-worker.example.workers.dev/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" })
    });
    await loadPosts();
  } catch (err) {
    console.error("Erreur like:", err);
  }
}

/* ===== COMMENT ===== */
async function addComment(postId) {
  const input = document.getElementById("input-"+postId);
  const text = input.value.trim();
  if(text === "") return;

  const data = { action: "comment", username: userId, content: text };

  try {
    await fetch(`https://ton-worker.example.workers.dev/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    input.value = "";
    await loadPosts();
  } catch (err) {
    console.error("Erreur commentaire:", err);
  }
}

/* ===== CHARGEMENT INITIAL ===== */
window.addEventListener("DOMContentLoaded", loadPosts);
