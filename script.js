let sequence = [];
let player = [];
let level = 1;

let mode = "solo";
let currentPlayer = 1;

let scores = {1:0, 2:0};

let timer;
let timeLeft = 10;

let canPlay = false;
let canCheck = true;

const colors = ["red","green","blue","yellow"];

const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

// ================= MODE =================
function setMode(m){
  mode = m;

  document.getElementById("playersSetup").classList.add("hidden");

  if(mode === "duel"){
    document.getElementById("playersSetup").classList.remove("hidden");
    document.getElementById("msg").textContent = "Entre les noms";
  } else {
    document.getElementById("msg").textContent = "Mode Solo prêt";
  }
}

// ================= START SOLO =================
function startGame(){
  mode = "solo";
  level = 1;
  scores = {1:0,2:0};
  nextRound();
}

// ================= START DUEL =================
function startDuel(){
  level = 1;
  currentPlayer = 1;
  scores = {1:0,2:0};

  document.getElementById("turn").textContent =
    "Tour de " + document.getElementById("p1").value;

  nextRound();
}

// ================= ROUND =================
function nextRound(){
  player = [];
  sequence = [];

  canPlay = false;
  canCheck = true;

  let length = 3 + level;

  for(let i=0;i<length;i++){
    sequence.push(colors[Math.floor(Math.random()*4)]);
  }

  document.getElementById("msg").textContent = "👀 Observe";
  showSequence();
}

// ================= SHOW =================
function showSequence(){
  let i = 0;
  let speed = 500;

  let interval = setInterval(()=>{
    flash(sequence[i]);
    i++;
    if(i>=sequence.length) clearInterval(interval);
  },speed);

  setTimeout(()=>{
    canPlay = true;
    document.getElementById("msg").textContent = "Reproduis";
  }, sequence.length * speed);
}

// ================= FLASH =================
function flash(c){
  let el = document.querySelector("." + c);
  el.classList.add("active");
  clickSound.play();

  setTimeout(()=> el.classList.remove("active"),200);
}

// ================= PICK =================
function pick(color){
  if(!canPlay) return;
  player.push(color);
}

// ================= CHECK =================
function check(){
  if(!canCheck) return;
  canCheck = false;

  let ok = JSON.stringify(player) === JSON.stringify(sequence);

  if(ok){
    winSound.play();

    if(mode === "solo"){
      level++;
      setTimeout(nextRound,800);
    } else {
      scores[currentPlayer] += level * 10;

      currentPlayer = currentPlayer === 1 ? 2 : 1;

      document.getElementById("turn").textContent =
        "Tour de " + (currentPlayer===1 ?
        document.getElementById("p1").value :
        document.getElementById("p2").value);

      setTimeout(nextRound,800);
    }

  } else {
    failSound.play();
    alert("Perdu !");
  }
}
