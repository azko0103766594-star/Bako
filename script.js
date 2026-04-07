const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const publishBtn = document.getElementById("publishBtn");

let posts = [];
const userId = "user1";

// 🔹 bouton publier FIX
publishBtn.addEventListener("click", () => {
  upload.value = "";
  upload.click();
});

// 🔹 Upload image
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const name = Date.now() + "_" + file.name;

    // 🔹 Upload
    const { error: uploadError } = await supabaseClient.storage
      .from("Abk2")
      .upload(name, file);

    if (uploadError) throw uploadError;

    // 🔹 URL publique
    const { data } = supabaseClient.storage.from("Abk2").getPublicUrl(name);
    const url = data.publicUrl;

    // 🔹 Insert DB
    const { error: insertError } = await supabaseClient
      .from("posts")
      .insert([{
        url: url,
        likes: [],
        comments: []
      }]);

    if (insertError) throw insertError;

    // 🔹 refresh
    fetchPosts();

  } catch (err) {
    console.error(err);
    alert("Erreur upload: " + err.message);
  }
});

// 🔹 Fetch posts
async function fetchPosts() {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    alert("Erreur fetch: " + error.message);
    return;
  }

  posts = data || [];
  renderFeed();
}

// 🔹 Affichage
function renderFeed() {
  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = "Aucune image";
    return;
  }

  posts.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${p.url}" width="150"><br>
      ❤️ ${p.likes?.length || 0}<br>
      <button onclick="likePost('${p.id}')">Like</button>
    `;

    feed.appendChild(div);
  });
}

// 🔹 Like
window.likePost = async (id) => {
  const p = posts.find(x => x.id == id);
  if (!p) return;

  if (!p.likes) p.likes = [];

  if (p.likes.includes(userId)) {
    p.likes = p.likes.filter(x => x !== userId);
  } else {
    p.likes.push(userId);
  }

  const { error } = await supabaseClient
    .from("posts")
    .update({ likes: p.likes })
    .eq("id", id);

  if (error) {
    alert("Erreur like");
    return;
  }

  fetchPosts();
};

// 🔹 init
fetchPosts();
    posts = data || [];
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

    // 🔹 Forcer récupération après like
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

    // 🔹 Forcer récupération après commentaire
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

// 🔹 Auto-refresh toutes les 5 secondes (backup si Realtime ne marche pas)
setInterval(fetchPosts, 5000);

// 🔹 Init
fetchPosts();
