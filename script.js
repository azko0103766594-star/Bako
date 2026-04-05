const feed = document.getElementById("feed");
const shareBox = document.getElementById("shareBox");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const upload = document.getElementById("upload");

/* USER ID (important) */
const userId = localStorage.getItem("userId") || Date.now().toString();
localStorage.setItem("userId", userId);

let photos = [];
let currentShareIndex = null;
let currentCommentIndex = null;

/* LOAD FROM LOCALSTORAGE */
function fetchPhotos(){
  photos = JSON.parse(localStorage.getItem("photos")) || [];
  render();
}

/* SAVE */
function savePhotos(){
  localStorage.setItem("photos", JSON.stringify(photos));
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
          <button onclick="toggleLike(${i})">${liked?"Dislike":"Like"}</button>
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
function toggleLike(i){
  const photo = photos[i];
  const index = photo.likesUsers.indexOf(userId);

  if(index === -1) photo.likesUsers.push(userId);
  else photo.likesUsers.splice(index,1);

  savePhotos();
  render();
}

/* COMMENT */
function openComments(i){
  currentCommentIndex = i;
  updateComments();
  commentOverlay.style.display = "flex";
}

function updateComments(){
  commentList.innerHTML = photos[currentCommentIndex].comments
    .map(c => `<p>${c}</p>`)
    .join("");
}

function submitComment(){
  const v = commentInput.value.trim();
  if(!v) return;

  photos[currentCommentIndex].comments.push(v);
  commentInput.value = "";

  savePhotos();
  updateComments();
  render();
}

/* UPLOAD */
function handlePublish(){
  upload.click();
}

upload.addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = ()=>{
    const newPhoto = {
      url: reader.result,
      likesUsers: [],
      viewsUsers: [],
      comments: []
    };

    photos.unshift(newPhoto); // ajoute en haut
    savePhotos();
    render();
  };

  reader.readAsDataURL(file);
});

/* INIT */
fetchPhotos();
