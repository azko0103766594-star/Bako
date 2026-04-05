// ===============================
// Mini Bako - Toutes fonctionnalités (stockage local)
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  // --- CONFIG CLOUDINARY ---
  const CLOUD_NAME = "mini_bako_cloud";       // Remplace par ton Cloud Name
  const UPLOAD_PRESET = "preset_gratuit_2";   // Remplace par ton preset unsigned

  // --- SÉLECTEURS DOM ---
  const feed = document.getElementById("feed");
  const upload = document.getElementById("upload");
  const btnPublish = document.getElementById("btnPublish");
  const shareBox = document.getElementById("shareBox");
  const commentOverlay = document.getElementById("commentOverlay");
  const commentList = document.getElementById("commentList");
  const commentInput = document.getElementById("commentInput");

  // --- VARIABLES ---
  let photos = JSON.parse(localStorage.getItem("photos")) || [];
  let currentCommentIndex = null;
  let userId = localStorage.getItem("userId") || "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("userId", userId);

  // ===============================
  // UPLOAD IMAGE SUR CLOUDINARY
  // ===============================
  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload Cloudinary échoué !");
    return data.secure_url;
  }

  // ===============================
  // AJOUTER PHOTO DANS LE FEED
  // ===============================
  function addPhoto(url) {
    const newPhoto = { url, likesUsers: [], viewsUsers: [], comments: [] };
    photos.push(newPhoto);
    localStorage.setItem("photos", JSON.stringify(photos));
    render();
  }

  // ===============================
  // RENDU DU FEED
  // ===============================
  function render() {
    feed.innerHTML = "";
    if (photos.length === 0) {
      feed.innerHTML = '<div class="empty">Aucune image</div>';
      return;
    }

    photos.forEach((p, i) => {
      if (!p.viewsUsers.includes(userId)) p.viewsUsers.push(userId);

      const liked = p.likesUsers.includes(userId);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.url}" alt="Photo">
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
  // LIKE / DISLIKE
  // ===============================
  window.toggleLike = function(i) {
    const photo = photos[i];
    const index = photo.likesUsers.indexOf(userId);
    if (index === -1) photo.likesUsers.push(userId);
    else photo.likesUsers.splice(index, 1);
    localStorage.setItem("photos", JSON.stringify(photos));
    render();
  }

  // ===============================
  // COMMENTAIRES
  // ===============================
  window.openComments = function(i) {
    currentCommentIndex = i;
    updateComments();
    commentOverlay.style.display = "flex";
  }

  function updateComments() {
    const photo = photos[currentCommentIndex];
    if (!photo) return;
    commentList.innerHTML = photo.comments.map(c => `<p>${c}</p>`).join("");
  }

  window.submitComment = function() {
    const text = commentInput.value.trim();
    if (!text) return;
    photos[currentCommentIndex].comments.push(text);
    commentInput.value = "";
    localStorage.setItem("photos", JSON.stringify(photos));
    updateComments();
    render();
  }

  window.closeComments = function() {
    commentOverlay.style.display = "none";
  }

  // ===============================
  // PARTAGE
  // ===============================
  window.openShare = function(i) {
    shareBox.style.display = "flex";
  }

  window.closeShare = function() {
    shareBox.style.display = "none";
  }

  window.sharePost = function() {
    const link = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "Mini Bako", text: "Regarde ce post 🔥", url: link });
    } else {
      alert("Partage non supporté");
    }
  }

  // ===============================
  // BOUTON PUBLIER
  // ===============================
  btnPublish.addEventListener("click", () => upload.click());

  upload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadToCloudinary(file);
      addPhoto(url);
      upload.value = "";
    } catch (err) {
      console.error("Erreur upload:", err);
      alert("Échec de l'upload. Vérifie la console.");
    }
  });

  // ===============================
  // INIT
  // ===============================
  render();

});
