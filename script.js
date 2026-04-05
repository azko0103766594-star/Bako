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

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "preset_gratuit_2"); // ton preset
  formData.append("cloud_name", "TON_CLOUD_NAME"); // ⚠️ remplace

  try {
    // 1. Upload vers Cloudinary
    const res = await fetch("https://api.cloudinary.com/v1_1/TON_CLOUD_NAME/image/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    // 2. Sauvegarde dans ton backend
    const newPhoto = {
      url: data.secure_url, // ✅ URL cloudinary
      likesUsers: [],
      viewsUsers: [],
      comments: []
    };

    await savePhoto(newPhoto);

  } catch (err) {
    console.error("Erreur upload:", err);
  }
});

/* INIT */
fetchPhotos();
