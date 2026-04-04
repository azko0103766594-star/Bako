/* USER */
let userId = localStorage.getItem("userId");
if(!userId){
  userId="user_"+Math.random().toString(36).substr(2,9);
  localStorage.setItem("userId",userId);
}

/* DATA */
let photos = JSON.parse(localStorage.getItem("photos")) || [];
let currentShareIndex = null;
let currentCommentIndex = null;

const feed = document.getElementById("feed");
const shareBox = document.getElementById("shareBox");
const commentOverlay = document.getElementById("commentOverlay");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const upload = document.getElementById("upload");

/* SAVE */
function save() {
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
    if(!p.viewsUsers.includes(userId)) p.viewsUsers.push(userId);
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

  save();
}

/* LIKE */
function toggleLike(i){
  const index = photos[i].likesUsers.indexOf(userId);
  if(index === -1) photos[i].likesUsers.push(userId);
  else photos[i].likesUsers.splice(index,1);
  render();
}

/* SHARE */
function openShare(i){
  currentShareIndex = i;
  shareBox.style.display = "flex";
}

function closeShare(){
  shareBox.style.display = "none";
}

function sharePost(){
  const link = window.location.href;
  if(navigator.share){
    navigator.share({
      title: "Mini Bako",
      text: "Regarde ce post 🔥",
      url: link
    });
  } else {
    alert("Partage non supporté");
  }
}

/* COMMENT */
function openComments(i){
  currentCommentIndex = i;
  updateComments();
  commentOverlay.style.display = "flex";
}

function closeComments(){
  commentOverlay.style.display = "none";
}

function updateComments(){
  commentList.innerHTML = photos[currentCommentIndex].comments
    .map(c => `<p>${c}</p>`).join("");
}

function submitComment(){
  const v = commentInput.value.trim();
  if(!v) return;
  photos[currentCommentIndex].comments.push(v);
  commentInput.value = "";
  save();
  updateComments();
  render();
}

/* UPLOAD */
function handlePublish(){
  upload.click();
}

upload.addEventListener("change", e => {
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    photos.unshift({
      url: reader.result,
      likesUsers: [],
      viewsUsers: [],
      comments: []
    });
    render();
  };
  reader.readAsDataURL(file);
});

/* INIT */
render();