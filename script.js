// 🔹 Supabase config
const SUPABASE_URL = "https://sablkcwsqethbysqusgb.supabase.co";  // remplace par ton URL
const SUPABASE_ANON_KEY = "TON_ANON_KEY";                          // remplace par ta clé ANON
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔹 Elements HTML
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = [];
let currentCommentId = null;
const userId = "user1"; // plus tard remplacer par vrai auth

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
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("images")
      .upload(`public/${file.name}`, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Récupérer URL publique
    const { publicUrl, error: urlError } = supabase
      .storage
      .from("images")
      .getPublicUrl(`public/${file.name}`);

    if (urlError) throw urlError;

    // Ajouter post dans la table 'posts'
    const { data: newPostData, error: insertError } = await supabase
      .from("posts")
      .insert([{ url: publicUrl, likes: [], comments: [] }])
      .select();

    if (insertError) throw insertError;

    // Ajouter au feed local
    posts.push(newPostData[0]);
    renderFeed();

  } catch (err) {
    console.error("Erreur upload :", err);
    alert("Erreur lors de l'upload : " + err.message);
  }
});

// 🔹 Récupérer tous les posts depuis Supabase
async function fetchPosts() {
  const { data, error } = await supabase.from("posts").select("*");
  if (error) return console.error(error);
  posts = data;
  renderFeed();
}

// 🔹 Rendu du feed
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
      <img src="${p.url}" style="width:200px; margin:10px">
      <div>
        ❤️ ${p.likes?.length || 0} | 💬 ${p.comments?.length || 0}
      </div>
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
async function toggleLike(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  if (post.likes.includes(userId)) post.likes = post.likes.filter(u => u !== userId);
  else post.likes.push(userId);

  // Mettre à jour Supabase
  const { error } = await supabase
    .from("posts")
    .update({ likes: post.likes })
    .eq("id", postId);

  if (error) return console.error(error);

  renderFeed();
}

// 🔹 Ouvrir commentaires
function openComments(postId) {
  currentCommentId = postId;
  updateComments();
  commentOverlay.style.display = "flex";
}

// 🔹 Afficher commentaires
function updateComments() {
  const post = posts.find(p => p.id === currentCommentId);
  if (!post) return;
  commentList.innerHTML = (post.comments || []).map(c => `<p>${c}</p>`).join("");
}

// 🔹 Ajouter un commentaire
async function submitComment() {
  const v = commentInput.value.trim();
  if (!v) return;

  const post = posts.find(p => p.id === currentCommentId);
  post.comments.push(v);

  // Mettre à jour Supabase
  const { error } = await supabase
    .from("posts")
    .update({ comments: post.comments })
    .eq("id", currentCommentId);

  if (error) return console.error(error);

  commentInput.value = "";
  updateComments();
  renderFeed();
}

// 🔹 Fermer overlay
function closeComments() {
  commentOverlay.style.display = "none";
}

// 🔹 Initialisation
fetchPosts();
