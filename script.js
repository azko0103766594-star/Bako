let sequence = [];
let player = [];
let canPlay = false;

const colors = ["red","green","blue","yellow"];

function startGame(){
  sequence = [];
  player = [];
  canPlay = false;

  document.getElementById("msg").textContent = "Observe 👀";

  let length = 4;

  for(let i=0;i<length;i++){
    sequence.push(colors[Math.floor(Math.random()*4)]);
  }

  showSequence();
}

function showSequence(){
  let i = 0;

  let interval = setInterval(()=>{
    flash(sequence[i]);
    i++;
    if(i>=sequence.length) clearInterval(interval);
  },700);

  setTimeout(()=>{
    canPlay = true;
    document.getElementById("msg").textContent = "À toi 🎮";
  },3000);
}

function flash(color){
  let el = document.querySelector("."+color);
  el.style.opacity = "1";

  setTimeout(()=>{
    el.style.opacity = "0.7";
  },300);
}

function pick(color){
  if(!canPlay) return;

  player.push(color);

  let i = player.length - 1;

  if(player[i] !== sequence[i]){
    document.getElementById("msg").textContent = "❌ Perdu";
    canPlay = false;
    return;
  }

  if(player.length === sequence.length){
    document.getElementById("msg").textContent = "🔥 Gagné !";
    canPlay = false;
  }
}
