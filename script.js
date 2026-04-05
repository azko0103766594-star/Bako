// 🔹 Récupération des éléments
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = [];
let currentCommentId = null;

// 🔹 Ouvrir le input file
function handlePublish() {
  upload.click();
}

// 🔹 Upload image + ajouter post dans Supabase
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Upload dans Supabase Storage
    const { data, error } = await supabase.storage
      .from("images")
      .upload(`public/${file.name}`, file, { upsert: true });

    if (error) throw error;

    // Récupérer l'URL publique
    const { publicUrl, error: urlError } = supabase
      .storage
      .from("images")
      .getPublicUrl(`public/${file.name}`);

    if (urlError) throw urlError;

    // Créer un nouveau post
    const newPost = {
      id: Date.now().toString(), // simple ID temporaire
      url: publicUrl,
      likes: [],
      comments: []
    };

    // Ajouter dans la liste des posts et réafficher
    posts.unshift(newPost);
    renderFeed();

  } catch (err) {
    console.error("Erreur upload:", err);
    alert("Erreur lors de l'upload !");
  }
});

// 🔹 Affichage du feed
function renderFeed() {
  feed.innerHTML = "";
  if (posts.length === 0) {
    feed.innerHTML = "<div class='empty'>Aucune image</div>";
    return;
  }

  posts.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.url}" style="width:200px; margin:10px">
      <div>❤️ ${p.likes.length} | 💬 ${p.comments.length}</div>
      <div>
        <button onclick="toggleLike(${i})">
          ${p.likes.includes("user1") ? "Dislike" : "Like"}
        </button>
        <button onclick="openComments(${i})">💬 Commenter</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

// 🔹 Like / Dislike
function toggleLike(index) {
  const post = posts[index];
  const userId = "user1"; // à remplacer par vrai user auth
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(u => u !== userId);
  } else {
    post.likes.push(userId);
  }
  renderFeed();
}

// 🔹 Ouvrir les commentaires
function openComments(index) {
  currentCommentId = index;
  updateComments();
  commentOverlay.style.display = "flex";
}

// 🔹 Afficher les commentaires
function updateComments() {
  const post = posts[currentCommentId];
  if (!post) return;
  commentList.innerHTML = (post.comments || []).map(c => `<p>${c}</p>`).join("");
}

// 🔹 Ajouter un commentaire
function submitComment() {
  const v = commentInput.value.trim();
  if (!v) return;
  posts[currentCommentId].comments.push(v);
  commentInput.value = "";
  updateComments();
  renderFeed();
}

// 🔹 Fermer overlay
function closeComments() {
  commentOverlay.style.display = "none";
}

// 🔹 Initialisation
renderFeed();
