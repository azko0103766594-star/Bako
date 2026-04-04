// ===============================
// Mini Bako - script.js
// ===============================

// URL du Worker Cloudflare
// Pour l'instant, on met un placeholder. Remplace-le par l'URL de ton Worker après déploiement.
const WORKER_URL = "/api/photos"; // Exemple : "https://mini-bako-worker.<compte>.workers.dev/api/photos"

// ===============================
// Sélecteurs DOM
// ===============================
const feed = document.getElementById("feed");
const shareBox = document.getElementById("shareBox");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const upload = document.getElementById("upload");

// ===============================
// Variables globales
// ===============================
let photos = [];
let currentShareIndex = null;
let currentCommentIndex = null;

// Création d'un userId unique pour gérer likes et vues
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("userId", userId);
}

// ===============================
// Fetch toutes les photos
// ===============================
async function fetchPhotos() {
  try {
    const res = await fetch(WORKER_URL);
    photos = await res.json();
    render();
  } catch (err) {
    console.error("Erreur fetchPhotos:", err);
    feed.innerHTML = '<div class="empty">Impossible de récupérer les images</div>';
  }
}

// ===============================
// Enregistrer ou mettre à jour une photo
// ===============================
async function savePhoto(photo) {
  try {
    await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(photo),
    });
    await fetchPhotos();
  } catch (err) {
    console.error("Erreur savePhoto:", err);
  }
}

// ===============================
// Rendu du feed
// ===============================
function render() {
  feed.innerHTML = "";
  if (photos.length === 0) {
    feed.innerHTML = '<div class="empty">Aucune image</div>';
    return;
  }

  photos.forEach((p, i) => {
    // Ajouter la vue si ce user n'a pas encore vu
    if (!p.viewsUsers.includes(userId)) p.viewsUsers.push(userId);

    const liked = p.likesUsers.includes(userId);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.url}">
      <div class="actions">
        <span>❤️ ${p.likesUsers.length} | 👁️ ${p.viewsUsers.length}</span>
        <div>
          <button class="like-btn" onclick="toggleLike(${i})">${liked ? "Dislike" : "Like"}</button>
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

// ===============================
// Like / Dislike
// ===============================
async function toggleLike(i) {
  const photo = photos[i];
  const index = photo.likesUsers.indexOf(userId);
  if (index === -1) photo.likesUsers.push(userId);
  else photo.likesUsers.splice(index, 1);
  await savePhoto(photo);
}

// ===============================
// Commentaires
// ===============================
function openComments(i) {
  currentCommentIndex = i;
  updateComments();
  commentOverlay.style.display = "flex";
}

function updateComments() {
  commentList.innerHTML = photos[currentCommentIndex].comments
    .map((c) => `<p>${c}</p>`)
    .join("");
}

async function submitComment() {
  const v = commentInput.value.trim();
  if (!v) return;
  photos[currentCommentIndex].comments.push(v);
  commentInput.value = "";
  await savePhoto(photos[currentCommentIndex]);
}

// ===============================
// Partage
// ===============================
function openShare(i) {
  currentShareIndex = i;
  shareBox.style.display = "flex";
}

function closeShare() {
  shareBox.style.display = "none";
}

function sharePost() {
  const link = window.location.href;
  if (navigator.share) {
    navigator.share({
      title: "Mini Bako",
      text: "Regarde ce post 🔥",
      url: link,
    });
  } else {
    alert("Partage non supporté");
  }
}

// ===============================
// Upload
// ===============================
function handlePublish() {
  upload.click();
}

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const newPhoto = { url: reader.result, likesUsers: [], viewsUsers: [], comments: [] };
    await savePhoto(newPhoto);
  };
  reader.readAsDataURL(file);
});

// ===============================
// Init
// ===============================
fetchPhotos();
