// 🔹 Mini-Bako JS complet pour bucket public "mini-bako"

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

    // 🔹 Upload dans le bucket public "mini-bako"
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("mini-bako")
      .upload(name, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 🔹 Récupérer l'URL publique
    const { data } = supabase.storage.from("mini-bako").getPublicUrl(name);
    const url = data.publicUrl;

    // 🔹 Ajouter le post dans Supabase
    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert([{ url, likes: [], comments: [] }])
      .select();

    if (insertError) throw insertError;

    // 🔹 Refetch pour forcer la récupération
    await fetchPosts();

  } catch (err) {
    console.error("Erreur upload :", err);
    alert("Erreur lors de la publication. Vérifie que le bucket mini-bako est public.\n" 
          + (err.message || JSON.stringify(err)));
  }
});

// 🔹 Récupérer posts depuis Supabase
async function fetchPosts() {
  try {
    const { data, error } = await supabase.from("posts").select("*").order("id", { ascending: false });
    if (error) throw error;
    posts = data;
    renderFeed();
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

    // 🔹 Refetch après like
    await fetchPosts();

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

    // 🔹 Refetch après commentaire
    await fetchPosts();

  } catch (err) {
    console.error("Erreur commentaire :", err);
    alert("Impossible d'ajouter ce commentaire.\n" + (err.message || JSON.stringify(err)));
  }
};

// 🔹 Fermer overlay
window.closeComments = () => commentOverlay.style.display = "none";

// 🔹 Realtime Supabase pour updates instantanées
supabase
  .channel('realtime-posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
    console.log('Changement post détecté :', payload);
    fetchPosts();
  })
  .subscribe();

// 🔹 Auto-refresh toutes les 5 secondes (backup si realtime ne marche pas)
setInterval(fetchPosts, 5000);

// 🔹 Init
fetchPosts();
