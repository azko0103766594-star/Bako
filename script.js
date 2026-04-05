import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.mjs";

// 🔹 Supabase
const SUPABASE_URL = "https://TON_PROJECT.supabase.co";  // remplace par ton URL
const SUPABASE_ANON_KEY = "TON_ANON_KEY";               // remplace par ta clé anonyme
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔹 Éléments DOM
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const publishBtn = document.getElementById("publishBtn");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const sendCommentBtn = document.getElementById("sendCommentBtn");
const closeCommentBtn = document.getElementById("closeCommentBtn");

let posts = [];
let currentCommentId = null;
const userId = "user1";

// 🔹 Bouton Publier
publishBtn.addEventListener("click", () => upload.click());

// 🔹 Upload image + création post
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("images")
      .upload(`public/${file.name}`, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { publicUrl, error: urlError } = supabase
      .storage
      .from("images")
      .getPublicUrl(`public/${file.name}`);
    if (urlError) throw urlError;

    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert([{ url: publicUrl, likes: [], comments: [] }])
      .select();
    if (insertError) throw insertError;

    posts.push(newPost[0]);
    renderFeed();

  } catch (err) {
    console.error("Erreur upload :", err);
    alert("Erreur lors de l'upload : " + err.message);
  }
});

// 🔹 Récupérer tous les posts
async function fetchPosts() {
  const { data, error } = await supabase.from("posts").select("*");
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
        <button class="likeBtn" data-id="${p.id}">
          ${p.likes?.includes(userId) ? 'Dislike' : 'Like'}
        </button>
        <button class="commentBtn" data-id="${p.id}">💬 Commenter</button>
      </div>
    `;
    feed.appendChild(card);
  });

  // 🔹 Ajouter événements aux boutons dynamiques
  document.querySelectorAll(".likeBtn").forEach(btn => {
    btn.addEventListener("click", () => toggleLike(btn.dataset.id));
  });
  document.querySelectorAll(".commentBtn").forEach(btn => {
    btn.addEventListener("click", () => openComments(btn.dataset.id));
  });
}

// 🔹 Like / Dislike
async function toggleLike(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  if (post.likes.includes(userId)) post.likes = post.likes.filter(u => u !== userId);
  else post.likes.push(userId);

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

// 🔹 Afficher les commentaires
function updateComments() {
  const post = posts.find(p => p.id === currentCommentId);
  if (!post) return;

  commentList.innerHTML = (post.comments || []).map(c => `<p>${c}</p>`).join("");
}

// 🔹 Ajouter un commentaire
sendCommentBtn.addEventListener("click", async () => {
  const v = commentInput.value.trim();
  if (!v) return;

  const post = posts.find(p => p.id === currentCommentId);
  post.comments.push(v);

  const { error } = await supabase
    .from("posts")
    .update({ comments: post.comments })
    .eq("id", currentCommentId);
  if (error) return console.error(error);

  commentInput.value = "";
  updateComments();
  renderFeed();
});

// 🔹 Fermer overlay
closeCommentBtn.addEventListener("click", () => {
  commentOverlay.style.display = "none";
});

// 🔹 Initialisation
fetchPosts();
