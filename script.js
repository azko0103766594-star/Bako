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

// 🔹 Upload image + ajouter post dans Firestore
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 🔹 Uploader image dans Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')  // nom de ton bucket Supabase
      .upload(`public/${Date.now()}_${file.name}`, file);

    if (error) throw error;

    // 🔹 Récupérer l'URL publique de l'image
    const { publicUrl, error: urlError } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    if (urlError) throw urlError;

    // 🔹 Ajouter document dans Firestore
    await addDoc(collection(firebaseApp.db, "posts"), {
      url: publicUrl,
      likes: [],
      comments: []
    });

    fetchPosts();

  } catch (err) {
    console.error("Erreur upload:", err);
    alert("Erreur lors de l'upload !");
  }
});

// 🔹 Récupérer tous les posts
async function fetchPosts() {
  const querySnapshot = await getDocs(collection(firebaseApp.db, "posts"));
  posts = [];
  querySnapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
  renderFeed();
}

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
      <img src="${p.url}" style="width:200px; margin:10px">
      <div>
        ❤️ ${p.likes?.length || 0} | 💬 ${p.comments?.length || 0}
      </div>
      <div>
        <button onclick="toggleLike('${p.id}', ${i})">
          ${p.likes?.includes('user1') ? 'Dislike' : 'Like'}
        </button>
        <button onclick="openComments('${p.id}')">💬 Commenter</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

// 🔹 Like / Dislike
async function toggleLike(postId, index) {
  const postRef = doc(firebaseApp.db, "posts", postId);
  const post = posts[index];
  const userId = "user1"; // remplacer plus tard par vrai user auth
  let likes = post.likes || [];

  if (likes.includes(userId)) likes = likes.filter(u => u !== userId);
  else likes.push(userId);

  await updateDoc(postRef, { likes });
  fetchPosts();
}

// 🔹 Ouvrir les commentaires
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
async function submitComment() {
  const v = commentInput.value.trim();
  if (!v) return;
  const postRef = doc(firebaseApp.db, "posts", currentCommentId);
  const post = posts.find(p => p.id === currentCommentId);
  const comments = post.comments || [];
  comments.push(v);

  await updateDoc(postRef, { comments });
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
