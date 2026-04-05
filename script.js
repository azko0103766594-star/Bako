const feed = document.getElementById("feed");
const shareBox = document.getElementById("shareBox");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const upload = document.getElementById("upload");

let photos = [];
let currentShareIndex = null;
let currentCommentIndex = null;

/* FETCH PHOTOS GLOBAL */
async function fetchPhotos(){
  const res = await fetch("/api/photos");
  photos = await res.json();
  render();
}

/* SAVE PHOTO / UPDATE */
async function savePhoto(photo){
  await fetch("/api/photos", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(photo)
  });
  await fetchPhotos();
}

/* RENDER */
function render() {
  feed.innerHTML = "";
  if(photos.length === 0){
    feed.innerHTML = '<div class="empty">Aucune image</div>';
    return;
  }

  photos.forEach((p, i) => {
    const liked = p.likesUsers.includes(userId);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.url}">
      <div class="actions">
        <span>❤️ ${p.likesUsers.length} | 👁️ ${p.viewsUsers.length}</span>
        <div>
          <button class="like-btn" onclick="toggleLike(${i})">${liked?"Dislike":"Like"}</button>
          <button onclick="openShare(${i})">🔗</button>
        </div>
      </div>
      <div style="padding:10px">
        <button onclick="openComments(${i})">💬 ${p.comments.length} commentaire(s)</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

/* LIKE */
async function toggleLike(i){
  const photo = photos[i];
  const index = photo.likesUsers.indexOf(userId);
  if(index===-1) photo.likesUsers.push(userId);
  else photo.likesUsers.splice(index,1);
  await savePhoto(photo);
}

/* COMMENT */
function openComments(i){
  currentCommentIndex = i;
  updateComments();
  commentOverlay.style.display = "flex";
}

function updateComments(){
  commentList.innerHTML = photos[currentCommentIndex].comments.map(c=>`<p>${c}</p>`).join("");
}

async function submitComment(){
  const v = commentInput.value.trim();
  if(!v) return;
  photos[currentCommentIndex].comments.push(v);
  commentInput.value="";
  await savePhoto(photos[currentCommentIndex]);
}

/* UPLOAD */
function handlePublish(){
  upload.click();
}

// Récupération des éléments
const feed = document.getElementById("feed");
const upload = document.getElementById("upload");

let posts = [];

// 1️⃣ Récupérer tous les posts depuis Firestore
async function fetchPosts() {
  const querySnapshot = await getDocs(collection(firebaseApp.db, "posts"));
  posts = [];
  querySnapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
  renderFeed();
}

// 2️⃣ Rendu du feed
function renderFeed() {
  feed.innerHTML = "";
  posts.forEach(p => {
    const card = document.createElement("div");
    card.innerHTML = `
      <img src="${p.url}" style="width:200px; margin:10px">
      <div>❤️ ${p.likes?.length || 0} | 💬 ${p.comments?.length || 0}</div>
    `;
    feed.appendChild(card);
  });
}

// 3️⃣ Upload image + Firestore
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Upload dans Firebase Storage
    const storageRef = ref(firebaseApp.storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Créer un post dans Firestore
    await addDoc(collection(firebaseApp.db, "posts"), {
      url,
      likes: [],
      comments: []
    });

    // Recharger le feed
    fetchPosts();

  } catch (err) {
    console.error("Erreur upload:", err);
  }
});

// Init
fetchPosts();

/* INIT */
fetchPhotos();
