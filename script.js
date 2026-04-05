// ===============================
// Mini Bako - Cloudinary + Firebase
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  // --- CONFIG CLOUDINARY ---
  const CLOUD_NAME = "mini_bako_cloud";      // Ton Cloud Name exact
  const UPLOAD_PRESET = "preset_gratuit_2";  // Ton preset unsigned exact

  // --- CONFIG FIREBASE ---
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
  import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
  import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "<ton_api_key>",
    authDomain: "<ton_project>.firebaseapp.com",
    projectId: "<ton_project>",
    storageBucket: "<ton_project>.appspot.com",
    messagingSenderId: "<ton_sender_id>",
    appId: "<ton_app_id>"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // --- USER ID ---
  let userId = localStorage.getItem("userId");
  if(!userId){
    userId = "user_"+Math.random().toString(36).substr(2,9);
    localStorage.setItem("userId", userId);
  }

  // --- SÉLECTEURS DOM ---
  const feed = document.getElementById("feed");
  const shareBox = document.getElementById("shareBox");
  const commentOverlay = document.getElementById("commentOverlay");
  const commentList = document.getElementById("commentList");
  const commentInput = document.getElementById("commentInput");
  const upload = document.getElementById("upload");

  let photos = [];
  let currentCommentId = null;

  // ===============================
  // UPLOAD IMAGE SUR CLOUDINARY
  // ===============================
  async function uploadToCloudinary(file){
    console.log("Upload commencé :", file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log("Upload terminé :", data.secure_url);
    return data.secure_url;
  }

  // ===============================
  // FIRESTORE - AJOUTER PHOTO
  // ===============================
  async function addPhoto(url){
    await addDoc(collection(db, "photos"), {
      url,
      likesUsers: [],
      viewsUsers: [],
      comments: []
    });
    console.log("Photo ajoutée à Firebase :", url);
    await fetchPhotos();
  }

  // ===============================
  // RÉCUPÉRER PHOTOS
  // ===============================
  async function fetchPhotos(){
    feed.innerHTML = "Chargement...";
    const snapshot = await getDocs(collection(db, "photos"));
    photos = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    render();
  }

  // ===============================
  // RENDU DU FEED
  // ===============================
  function render(){
    feed.innerHTML = "";
    if(photos.length===0){
      feed.innerHTML='<div class="empty">Aucune image</div>';
      return;
    }

    photos.forEach((p,i)=>{
      if(!p.viewsUsers.includes(userId)) p.viewsUsers.push(userId);

      const liked = p.likesUsers.includes(userId);

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML=`
        <img src="${p.url}">
        <div class="actions">
          <span>❤️ ${p.likesUsers.length} | 👁️ ${p.viewsUsers.length}</span>
          <div>
            <button class="like-btn" onclick="toggleLike('${p.id}')">${liked?"Dislike":"Like"}</button>
            <button onclick="openShare(${i})">🔗</button>
          </div>
        </div>
        <div style="padding:10px">
          <button onclick="openComments('${p.id}')">💬 ${p.comments.length} commentaire(s)</button>
        </div>
      `;

      feed.appendChild(card);
    });
  }

  // ===============================
  // LIKE / DISLIKE
  // ===============================
  window.toggleLike = async function(photoId){
    const photoRef = doc(db, "photos", photoId);
    const photo = photos.find(p=>p.id===photoId);
    if(!photo) return;

    if(photo.likesUsers.includes(userId)){
      photo.likesUsers = photo.likesUsers.filter(u=>u!==userId);
    } else {
      photo.likesUsers.push(userId);
    }

    await updateDoc(photoRef, { likesUsers: photo.likesUsers });
    await fetchPhotos();
  }

  // ===============================
  // COMMENTAIRES
  // ===============================
  window.openComments = function(photoId){
    currentCommentId = photoId;
    updateComments();
    commentOverlay.style.display = "flex";
  }

  function updateComments(){
    const photo = photos.find(p=>p.id===currentCommentId);
    if(!photo) return;
    commentList.innerHTML = photo.comments.map(c=>`<p>${c}</p>`).join("");
  }

  window.submitComment = async function(){
    const text = commentInput.value.trim();
    if(!text) return;

    const photo = photos.find(p=>p.id===currentCommentId);
    const photoRef = doc(db, "photos", currentCommentId);

    photo.comments.push(text);
    await updateDoc(photoRef, { comments: photo.comments });
    commentInput.value="";
    updateComments();
    render();
  }

  // ===============================
  // PARTAGE
  // ===============================
  window.openShare = function(i){
    shareBox.style.display = "flex";
  }

  window.closeShare = function(){
    shareBox.style.display = "none";
  }

  window.sharePost = function(){
    const link = window.location.href;
    if(navigator.share){
      navigator.share({ title:"Mini Bako", text:"Regarde ce post 🔥", url:link });
    }else{
      alert("Partage non supporté");
    }
  }

  // ===============================
  // UPLOAD IMAGE
  // ===============================
  window.handlePublish = function(){
    console.log("Bouton Publier cliqué !");
    upload.click();
  }

  upload.addEventListener("change", async e=>{
    const file = e.target.files[0];
    console.log("Fichier sélectionné :", file);
    if(!file) return;
    const url = await uploadToCloudinary(file);
    await addPhoto(url);
  });

  // ===============================
  // INIT
  // ===============================
  signInAnonymously(auth).then(fetchPhotos);

});
