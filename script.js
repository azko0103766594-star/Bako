const feed = document.getElementById("feed");
const upload = document.getElementById("upload");

let posts = [];

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
      <button onclick="likePost('${p.id}', ${i})">
        ${p.likes?.includes('user1') ? 'Dislike' : 'Like'}
      </button>
    `;

    feed.appendChild(card);
  });
}

// 🔹 Like / Dislike
async function likePost(postId, index) {
  const postRef = doc(firebaseApp.db, "posts", postId);
  const post = posts[index];
  const userId = "user1"; // temporaire, remplacer par vrai user
  let likes = post.likes || [];

  if (likes.includes(userId)) likes = likes.filter(u => u !== userId);
  else likes.push(userId);

  await updateDoc(postRef, { likes });
  fetchPosts();
}

// 🔹 Publier / Upload
function handlePublish() {
  upload.click();
}

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const storageRef = ref(firebaseApp.storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(firebaseApp.db, "posts"), {
      url,
      likes: [],
      comments: []
    });

    fetchPosts();

  } catch (err) {
    console.error("Erreur upload:", err);
  }
});

// 🔹 Init
fetchPosts();
