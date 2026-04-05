// 🔹 Récupération des éléments
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

// 🔹 Variables globales
let posts = [];
let currentCommentId = null;
const userId = "user1"; // temporaire, remplacer par auth Supabase si possible

// 🔹 Bouton Publier
window.handlePublish = function() {
  upload.click();
};

// 🔹 Upload image + création post Supabase
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Nom unique pour éviter écrasement
    const uniqueName = `${Date.now()}_${file.name}`;

    // Upload fichier
    const { data: uploadData, error: uploadError } = await window.supabase
      .storage
      .from("images")
      .upload(`public/${uniqueName}`, file, { upsert: true });
    if (uploadError) throw uploadError;

    // Récupérer l'URL publique
    const { data: { publicUrl }, error: urlError } = window.supabase
      .storage
      .from("images")
      .getPublicUrl(`public/${uniqueName}`);
    if (urlError) throw urlError;

    // Créer le post dans Supabase
    const { data: newPost, error: insertError } = await window.supabase
      .from("posts")
      .insert([{ url: publicUrl, likes: [], comments: [] }])
      .select();
    if (insertError) throw insertError;

    posts.push(newPost[0]);
    renderFeed();

  } catch (err) {
    console.error("Erreur upload :", err);
    alert("Erreur lors de l'upload : " + JSON.stringify(err));
  }
});

// 🔹 Récupérer tous les posts
async function fetchPosts() {
  const { data, error } = await window.supabase.from("posts").select("*");
  if (error) return console.error(error);

  posts = data;
  renderFeed();
}

// 🔹 Affichage du feed
function renderFeed() {
  feed.innerHTML = "";
  if (posts.length === 0) {
    feed.innerHTML = "<div class='empty'>Aucune image</div>";
    return;
  }

  posts.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.url}" alt="Post image" style="width:200px; margin:10px">
      <div>❤️ ${p.likes?.length || 0} | 💬 ${p.comments?.length || 0}</div>
      <div>
        <button onclick="toggleLike('${p.id}')">
          ${p.likes?.includes(userId) ? 'Dislike' : 'Like'}
        </button>
        <button onclick="openComments('${p.id}')">💬 Commenter</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

// 🔹 Like / Dislike
window.toggleLike = async function(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  if (post.likes.includes(userId)) post.likes = post.likes.filter(u => u !== userId);
  else post.likes.push(userId);

  const { error } = await window.supabase
    .from("posts")
    .update({ likes: post.likes })
    .eq("id", postId);
  if (error) return console.error(error);

  renderFeed();
};

// 🔹 Ouvrir commentaires
window.openComments = function(postId) {
  currentCommentId = postId;
  updateComments();
  commentOverlay.style.display = "flex";
};

// 🔹 Afficher les commentaires
function updateComments() {
  const post = posts.find(p => p.id === currentCommentId);
  if (!post) return;

  commentList.innerHTML = (post.comments || []).map(c => `<p>${c}</p>`).join("");
  // Scroll en bas pour voir le dernier commentaire
  commentList.scrollTop = commentList.scrollHeight;
}

// 🔹 Ajouter un commentaire
window.submitComment = async function() {
  const v = commentInput.value.trim();
  if (!v) return;

  const post = posts.find(p => p.id === currentCommentId);
  post.comments.push(v);

  const { error } = await window.supabase
    .from("posts")
    .update({ comments: post.comments })
    .eq("id", currentCommentId);
  if (error) return console.error(error);

  commentInput.value = "";
  updateComments();
  renderFeed();
};

// 🔹 Fermer overlay
window.closeComments = function() {
  commentOverlay.style.display = "none";
};

// 🔹 Initialisation
fetchPosts();
