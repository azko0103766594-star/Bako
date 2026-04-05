// 🔹 Éléments
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

// 🔹 Variables
let posts = [];
let currentCommentId = null;
const userId = "user1"; // temporaire

// 🔹 Bouton Publier
window.handlePublish = () => upload.click();

// 🔹 Upload image
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Vérifier que c’est bien une image
  if (!file.type.startsWith("image/")) {
    alert("Seules les images sont autorisées !");
    return;
  }

  try {
    const name = Date.now() + "_" + file.name;

    // Upload dans le bucket public "Bako"
    const { error: uploadError } = await supabase
      .storage
      .from("Bako")
      .upload(name, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Récupérer URL publique
    const { data } = supabase.storage.from("Bako").getPublicUrl(name);
    const url = data.publicUrl;

    // Créer le post dans la table "posts"
    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert([{ url, likes: [], comments: [] }])
      .select();

    if (insertError) throw insertError;

    posts.unshift(newPost[0]);
    renderFeed();

  } catch (err) {
    console.error("Erreur upload :", err);
    alert("Erreur : " + (err.message || JSON.stringify(err)));
  }
});

// 🔹 Récupérer posts
async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("id", { ascending: false });

  if (error) return console.error(error);

  posts = data;
  renderFeed();
}

// 🔹 Affichage feed
function renderFeed() {
  feed.innerHTML = "";

  if (posts.length === 0) {
    feed.innerHTML = "<div style='padding:20px; color:#777'>Aucune image</div>";
    return;
  }

  posts.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${p.url}" width="150"><br>
      ❤️ ${p.likes?.length || 0} | 💬 ${p.comments?.length || 0}<br>
      <button onclick="toggleLike('${p.id}')">
        ${p.likes?.includes(userId) ? "Dislike" : "Like"}
      </button>
      <button onclick="openComments('${p.id}')">Commenter</button>
    `;

    feed.appendChild(div);
  });
}

// 🔹 Like / Dislike
window.toggleLike = async (id) => {
  const p = posts.find(x => x.id == id);
  if (!p) return;

  if (p.likes.includes(userId)) p.likes = p.likes.filter(x => x !== userId);
  else p.likes.push(userId);

  await supabase
    .from("posts")
    .update({ likes: p.likes })
    .eq("id", id);

  renderFeed();
};

// 🔹 Commentaires
window.openComments = (id) => {
  currentCommentId = id;
  updateComments();
  commentOverlay.style.display = "flex";
};

function updateComments() {
  const p = posts.find(x => x.id == currentCommentId);
  commentList.innerHTML = (p.comments || []).map(c => `<p>${c}</p>`).join("");
  commentList.scrollTop = commentList.scrollHeight;
}

window.submitComment = async () => {
  const txt = commentInput.value.trim();
  if (!txt) return;

  const p = posts.find(x => x.id == currentCommentId);
  p.comments.push(txt);

  await supabase
    .from("posts")
    .update({ comments: p.comments })
    .eq("id", currentCommentId);

  commentInput.value = "";
  updateComments();
  renderFeed();
};

window.closeComments = () => commentOverlay.style.display = "none";

// 🔹 Initialisation
fetchPosts();
