// 🔹 Récupération des éléments HTML
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
    console.log("Upload file:", file.name);

    // 1️⃣ Upload dans Supabase Storage
    const { data, error: uploadError } = await supabase
      .storage
      .from("images")             // Nom du bucket
      .upload(`public/${file.name}`, file, { upsert: true });

    if (uploadError) {
      console.error("Erreur upload:", uploadError);
      alert("Erreur lors de l'upload ! Check console.");
      return;
    }

    console.log("Upload réussi :", data);

    // 2️⃣ Récupérer URL publique
    const { publicUrl, error: urlError } = supabase
      .storage
      .from("images")
      .getPublicUrl(`public/${file.name}`);

    if (urlError) {
      console.error("Erreur URL :", urlError);
      alert("Impossible de récupérer l'URL publique !");
      return;
    }

    console.log("URL publique :", publicUrl);

    // 3️⃣ Ajouter post dans Supabase table "posts"
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert([{ url: publicUrl, likes: [], comments: [] }]);

    if (postError) {
      console.error("Erreur création post :", postError);
      alert("Impossible de créer le post !");
      return;
    }

    console.log("Post créé :", postData);

    // 4️⃣ Recharger feed
    fetchPosts();

  } catch (err) {
    console.error("Erreur générale :", err);
    alert("Erreur lors de l'upload ! Check console.");
  }
});

// 🔹 Récupérer tous les posts
async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Erreur fetch posts :", error);
    return;
  }

  posts = data;
  renderFeed();
}

// 🔹 Affichage du feed
function renderFeed() {
  feed.innerHTML = "";
  if (!posts || posts.length === 0) {
    feed.innerHTML = "<div class='empty'>Aucune image</div>";
    return;
  }

  posts.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.url}" style="width:200px; margin:10px">
      <div>❤️ ${p.likes?.length || 0} | 💬 ${p.comments?.length || 0}</div>
      <div>
        <button onclick="toggleLike(${i})">
          ${p.likes?.includes("user1") ? "Dislike" : "Like"}
        </button>
        <button onclick="openComments(${i})">💬 Commenter</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

// 🔹 Like / Dislike
async function toggleLike(index) {
  const post = posts[index];
  const userId = "user1"; // remplacer plus tard par vrai user auth
  let likes = post.likes || [];

  if (likes.includes(userId)) likes = likes.filter(u => u !== userId);
  else likes.push(userId);

  const { error } = await supabase
    .from("posts")
    .update({ likes })
    .eq("id", post.id);

  if (error) console.error("Erreur toggle like :", error);

  fetchPosts();
}

// 🔹 Ouvrir les commentaires
function openComments(index) {
  currentCommentId = posts[index].id;
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
async function submitComment() {
  const v = commentInput.value.trim();
  if (!v) return;
  const post = posts.find(p => p.id === currentCommentId);
  const comments = post.comments || [];
  comments.push(v);

  const { error } = await supabase
    .from("posts")
    .update({ comments })
    .eq("id", currentCommentId);

  if (error) console.error("Erreur ajout commentaire :", error);

  commentInput.value = "";
  updateComments();
  fetchPosts();
}

// 🔹 Fermer overlay
function closeComments() {
  commentOverlay.style.display = "none";
}

// 🔹 Initialisation
fetchPosts();
