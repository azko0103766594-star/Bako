/**********************
 USER ID
**********************/
let userId = localStorage.getItem("userId");
if(!userId){
  userId="user_"+Math.random().toString(36).substr(2,9);
  localStorage.setItem("userId",userId);
}

/**********************
 API WORKER
**********************/
const API = "https://white-hill-40f5.jdjdurirjrrj2.workers.dev";
let photos=[];
let currentShareIndex=null;
let currentCommentIndex=null;

const feed=document.getElementById("feed");
const shareBox=document.getElementById("shareBox");

/**********************
 LOAD POSTS FROM WORKER
**********************/
async function loadPosts(){
  const res = await fetch(API+"/posts");
  photos = await res.json();
  render();
}

/**********************
 RENDER
**********************/
function render(){
  feed.innerHTML="";

  if(photos.length===0){
    feed.innerHTML='<div class="empty">Aucune image</div>';
    return;
  }

  photos.forEach((p,i)=>{

    const liked = p.likesUsers?.includes(userId);

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <img src="${p.url}">

      <div class="actions">
        <span>❤️ ${p.likesUsers?.length || 0} | 👁️ ${p.views || 0}</span>

        <div>
          <button class="like-btn" onclick="toggleLike(${i})">
            ${liked?"Dislike":"Like"}
          </button>

          <button onclick="openShare(${i})">🔗</button>
        </div>
      </div>

      <div style="padding:10px">
        <button onclick="openComments(${i})">
          💬 ${p.comments?.length || 0} commentaire(s)
        </button>
      </div>
    `;

    feed.appendChild(card);
  });
}

/**********************
 LIKE ❤️
**********************/
async function toggleLike(i){
  await fetch(API+"/like",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      postId: photos[i].id,
      userId: userId
    })
  });

  loadPosts();
}

/**********************
 SHARE 🔗
**********************/
function openShare(i){
  currentShareIndex=i;
  shareBox.style.display="flex";
}

function closeShare(){
  shareBox.style.display="none";
}

function sharePost(){
  const link = window.location.href;

  if(navigator.share){
    navigator.share({
      title:"Mini Bako",
      text:"Regarde ce post 🔥",
      url:link
    });
  }else{
    alert("Partage non supporté");
  }
}

/**********************
 COMMENTS 💬
**********************/
const commentOverlay=document.getElementById("commentOverlay");
const commentList=document.getElementById("commentList");
const commentInput=document.getElementById("commentInput");

function openComments(i){
  currentCommentIndex=i;
  updateComments();
  commentOverlay.style.display="flex";
}

function closeComments(){
  commentOverlay.style.display="none";
}

function updateComments(){
  const comments = photos[currentCommentIndex].comments || [];
  commentList.innerHTML = comments.map(c=>`<p>${c}</p>`).join("");
}

async function submitComment(){
  const v=commentInput.value.trim();
  if(!v) return;

  await fetch(API+"/comment",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      postId: photos[currentCommentIndex].id,
      text: v
    })
  });

  commentInput.value="";
  loadPosts();
}

/**********************
 UPLOAD IMAGE ☁️
**********************/
const upload=document.getElementById("upload");

function handlePublish(){
  upload.click();
}

upload.addEventListener("change", async e=>{
  const file=e.target.files[0];
  if(!file) return;

  const formData=new FormData();
  formData.append("file",file);

  await fetch(API+"/upload",{
    method:"POST",
    body:formData
  });

  loadPosts();
});

/**********************
 INIT
**********************/
loadPosts();
