// Vérification Supabase
if (!window.supabase) {
  alert("Supabase non chargé !");
  throw new Error("Supabase undefined");
}

// Elements
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");

let posts = [];
let currentCommentId = null;
const userId = "user1";

// Bouton publier
window.handlePublish = () => upload.click();

// Upload image
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const name = Date.now() + "_" + file.name;

    // Upload
    const { error: uploadError } = await supabase
      .storage
      .from("images")
      .upload(name, file);

    if (uploadError) throw uploadError;

    // URL
    const { data } = supabase
      .storage
      .from("images")
      .getPublicUrl(name);

    const url = data.publicUrl;

    // Insert DB
    const { data: newPost, error } = await supabase
      .from("posts")
      .insert([{ url, likes: [], comments: [] }])
      .select();

    if (error) throw error;

    posts.unshift(newPost[0]);
    render();

  } catch (err) {
    console.error(err);
    alert("Erreur : " + err.message);
  }
});

// Charger posts
async function fetchPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("id", { ascending: false });
  if (error) return console.error(error);

  posts = data;
  render();
}

// Affichage
function render() {
  feed.innerHTML = "";

  if (posts.length === 0) {
    feed.innerHTML = "Aucune image";
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

// Like
window.toggleLike = async (id) => {
  const p = posts.find(x => x.id == id);
  if (!p) return;

  if (p.likes.includes(userId))
    p.likes = p.likes.filter(x => x !== userId);
  else
    p.likes.push(userId);

  await supabase.from("posts").update({ likes: p.likes }).eq("id", id);

  render();
};

// Commentaires
window.openComments = (id) => {
  currentCommentId = id;
  updateComments();
  commentOverlay.style.display = "flex";
};

function updateComments() {
  const p = posts.find(x => x.id == currentCommentId);
  commentList.innerHTML = (p.comments || []).map(c => `<p>${c}</p>`).join("");
}

window.submitComment = async () => {
  const txt = commentInput.value.trim();
  if (!txt) return;

  const p = posts.find(x => x.id == currentCommentId);
  p.comments.push(txt);

  await supabase.from("posts").update({ comments: p.comments }).eq("id", currentCommentId);

  commentInput.value = "";
  updateComments();
  render();
};

window.closeComments = () => {
  commentOverlay.style.display = "none";
};

// Init
fetchPosts();
