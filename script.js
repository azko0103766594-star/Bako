let userId = localStorage.getItem("userId");
if(!userId){
  userId = "user_" + Math.random().toString(36).substr(2,9);
  localStorage.setItem("userId", userId);
}

let photos = [];
const feed = document.getElementById("feed");

function render() {
  feed.innerHTML = "";
  if(photos.length === 0){
    feed.innerHTML = '<div class="empty">Aucune image pour le moment</div>';
    return;
  }

  photos.forEach(p=>{
    const liked = p.likesUsers.includes(userId);
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.url}" alt="${p.title}">
      <div class="actions">
        <span>❤️ ${p.likesUsers.length} | 👁️ ${p.viewsUsers.length}</span>
        <button class="like-btn" onclick="toggleLike('${p.id}')">${liked?"Dislike":"Like"}</button>
      </div>
      <div style="padding:10px">
        <div id="comments-${p.id}">${p.comments.map(c=>`<p>💬 ${c.username}: ${c.content}</p>`).join("")}</div>
        <input id="input-${p.id}" placeholder="Écrire un commentaire..." style="width:70%;padding:6px;border-radius:10px;border:1px solid #ccc">
        <button onclick="addComment('${p.id}')">Envoyer</button>
      </div>
    `;

    feed.appendChild(card);
  });
}

async function loadPosts(){
  try {
    const res = await fetch("https://ton-worker.example.workers.dev/posts");
    const posts = await res.json();

    photos = posts.map(p=>({
      id: p.id,
      title: p.title,
      url: p.image_url,
      likesUsers: Array(p.likes).fill("user_placeholder"),
      viewsUsers: Array(p.views).fill("user_placeholder"),
      comments: p.comments || []
    }));
    render();
  } catch(e){
    console.error("Erreur loadPosts:", e);
  }
}

document.getElementById("upload").addEventListener("change", async function(e){
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = async function(){
    const data = { title:"Nouvelle image", image_url: reader.result };
    try{
      await fetch("https://ton-worker.example.workers.dev/posts", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(data)
      });
      await loadPosts();
    } catch(err){ console.error(err); }
  };
  reader.readAsDataURL(file);
});

async function toggleLike(postId){
  try {
    await fetch(`https://ton-worker.example.workers.dev/posts/${postId}`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ action:"like" })
    });
    await loadPosts();
  } catch(e){ console.error(e); }
}

async function addComment(postId){
  const input = document.getElementById("input-"+postId);
  const text = input.value.trim();
  if(!text) return;

  const data = { action:"comment", username:userId, content:text };
  try{
    await fetch(`https://ton-worker.example.workers.dev/posts/${postId}`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(data)
    });
    input.value="";
    await loadPosts();
  } catch(e){ console.error(e); }
}

window.addEventListener("DOMContentLoaded", loadPosts);