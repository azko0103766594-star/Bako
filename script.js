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

// 🔹 Upload image + ajouter post dans Supabase Storage
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 1️⃣ Upload dans Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("images")
      .upload(`public/${file.name}`, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    // 2️⃣ Récupérer l'URL publique
    const { publicUrl, error: urlError } = supabase
      .storage
      .from("images")
      .getPublicUrl(`public/${file.name}`);

    if (urlError) throw urlError;

    // 3️⃣ Ajouter le post dans ton “table” posts (Supabase DB ou Firestore selon ton setup)
    const newPost = {
      id: Date.now().toString(),
      url: publicUrl,
      likes: [],
      comments: []
    };
    posts.push(newPost);
    renderFeed();

    console.log("Upload réussi ! URL:", publicUrl);

  } catch (err) {
    console.error("Erreur lors de l'upload:", err.message || err);
    alert("Erreur lors de l'upload ! Vérifie les permissions et le nom du bucket.");
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
      <img src="${p.url}" style="width:200px; margin:10px; cursor:pointer;">
      <div>
        ❤️ ${p.likes?.length || 0} | 💬 ${p.comments?.length || 0}
      </div>
      <div>
        <button onclick="toggleLike(${i})">
          ${p.likes?.includes('user1') ? 'Dislike' : 'Like'}
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
  const userId = "user1"; // remplacer par authentification réelle plus tard
  let likes = post.likes || [];

  if (likes.includes(userId)) likes = likes.filter(u => u !== userId);
  else likes.push(userId);

  post.likes = likes;
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
  const post = posts[currentCommentId];
  post.comments = post.comments || [];
  post.comments.push(v);
  commentInput.value = "";
  updateComments();
  renderFeed();
}

// 🔹 Fermer overlay
function closeComments() {
  commentOverlay.style.display = "none";
}

// 🔹 Initialisation (optionnel si tu as déjà des posts)
renderFeed();
