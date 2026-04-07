// 🔹 Éléments DOM
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = [];
let currentCommentId = null;
const userId = "user1"; // temporaire

// 🔹 Ouvrir le sélecteur de fichiers
window.handlePublish = () => upload.click();

// 🔹 Upload image
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return alert("Seules les images sont autorisées !");

  try {
    const name = `${Date.now()}_${file.name}`;

    // 🔹 Upload dans le bucket public "Abk2"
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("Abk2")
      .upload(name, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 🔹 Récupérer l'URL publique
    const { data } = supabase.storage.from("Abk2").getPublicUrl(name);
    const url = data.publicUrl;

    // 🔹 Ajouter le post dans Supabase
    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert([{ url, likes: [], comments: [] }])
      .select();

    if (insertError) throw insertError;

    // 🔹 Refetch pour forcer la récupération
    await fetchPosts(true);

  } catch (err) {
    console.error("Erreur upload :", err);
    alert("Erreur lors de la publication. Vérifie que le bucket Abk2 est public.\n" 
          + (err.message || JSON.stringify(err)));
  }
});

// 🔹 Récupérer posts depuis Supabase
async function fetchPosts(force=false) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    // 🔹 Forcer la mise à jour si nécessaire
    if (force || JSON.stringify(data) !== JSON.stringify(posts)) {
      posts = data;
      renderFeed();
    }

  } catch (err) {
    console.error("Erreur fetch posts :", err);
    alert("Impossible de récupérer les posts.\n" + (err.message || JSON.stringify(err)));
  }
}

// 🔹 Affichage feed
function renderFeed() {
  feed.innerHTML = "";
  if (!posts.length) return feed.innerHTML = "<div class='empty'>Aucune image</div>";

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
  p.likes.includes(userId) ? p.likes = p.likes.filter(x => x !== userId) : p.likes.push(userId);

  try {
    const { error } = await supabase.from("posts").update({ likes: p.likes }).eq("id", id);
    if (error) throw error;

    await fetchPosts(true);

  } catch (err) {
    console.error("Erreur like :", err);
    alert("Impossible de liker ce post.\n" + (err.message || JSON.stringify(err)));
  }
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

  try {
    const { error } = await supabase.from("posts").update({ comments: p.comments }).eq("id", currentCommentId);
    if (error) throw error;

    commentInput.value = "";
    updateComments();
    await fetchPosts(true);

  } catch (err) {
    console.error("Erreur commentaire :", err);
    alert("Impossible d'ajouter ce commentaire.\n" + (err.message || JSON.stringify(err)));
  }
};

// 🔹 Fermer overlay
window.closeComments = () => commentOverlay.style.display = "none";

// 🔹 Auto-refresh toutes les 5 secondes
setInterval(() => fetchPosts(true), 5000);

// 🔹 Init
fetchPosts(true);
