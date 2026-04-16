// ===== VARIABLES =====
let sequence=[], player=[];
let level=1, score=0;
let timer, timeLeft;

let mode="solo";
let currentPlayer=1;
let scoreP1=0, scoreP2=0;

const colors=["red","green","blue","yellow"];

const clickSound=document.getElementById("clickSound");
const winSound=document.getElementById("winSound");
const failSound=document.getElementById("failSound");

// ===== START MODES =====
function startSolo(){
  mode="solo";
  document.getElementById("modeSelect").style.display="none";
  document.getElementById("gameUI").classList.remove("hidden");
  startGame();
}

function startDuel(){
  mode="duel";
  currentPlayer=1;
  scoreP1=0; scoreP2=0;

  document.getElementById("modeSelect").style.display="none";
  document.getElementById("gameUI").classList.remove("hidden");

  showPlayerScreen();
}

// ===== ECRAN JOUEUR (IMPORTANT DUEL) =====
function showPlayerScreen(){
  document.getElementById("flashGrid").style.display="none";
  document.getElementById("answerBox").classList.add("hidden");

  document.getElementById("msg").innerHTML =
    "📱 Passe le téléphone<br><br>👉 Joueur "+currentPlayer+"<br><br>Appuie pour commencer";

  document.getElementById("timer").textContent="";

  document.getElementById("gameUI").onclick = ()=>{
    document.getElementById("gameUI").onclick=null;
    startGame();
  }
}

// ===== START GAME =====
function startGame(){
  level=1;
  score=0;
  nextRound();
}

// ===== NEW ROUND =====
function nextRound(){
  sequence=[]; player=[];
  let length=3+level;

  for(let i=0;i<length;i++)
    sequence.push(colors[Math.floor(Math.random()*4)]);

  document.getElementById("msg").textContent="👀 Observe bien";
  document.getElementById("flashGrid").style.display="grid";
  document.getElementById("answerBox").classList.add("hidden");

  showSequence();
}

// ===== SHOW SEQUENCE =====
function showSequence(){
  let i=0, speed=600;

  let interval=setInterval(()=>{
    flash(sequence[i]);
    i++;
    if(i>=sequence.length) clearInterval(interval);
  },speed);

  setTimeout(()=>{
    document.getElementById("flashGrid").style.display="none";
    document.getElementById("answerBox").classList.remove("hidden");
    document.getElementById("msg").textContent="🎮 Reproduis";
    startTimer();
  },sequence.length*speed+600);
}

function flash(color){
  let el=document.querySelector("."+color);
  el.classList.add("active");
  clickSound.currentTime=0;
  clickSound.play();
  setTimeout(()=>el.classList.remove("active"),250);
}

// ===== PLAYER INPUT =====
function pick(color){ player.push(color); }

// ===== TIMER =====
function startTimer(){
  clearInterval(timer);
  timeLeft=Math.max(2,10-level);
  document.getElementById("timer").textContent="⏱ "+timeLeft;

  timer=setInterval(()=>{
    timeLeft--;
    document.getElementById("timer").textContent="⏱ "+timeLeft;
    if(timeLeft<=0) gameOver();
  },1000);
}

// ===== CHECK =====
function check(){
  clearInterval(timer);
  let ok = JSON.stringify(player)===JSON.stringify(sequence);

  if(ok){
    winSound.play();
    score+=level*10;
    level++;
    nextRound();
  } else gameOver();
}

// ===== GAME OVER (DUEL FIX) =====
function gameOver(){
  failSound.play();

  // SOLO
  if(mode==="solo"){
    alert("Score : "+score);
    startGame();
    return;
  }

  // JOUEUR 1 FINI
  if(currentPlayer===1){
    scoreP1=score;
    currentPlayer=2;
    showPlayerScreen();
    return;
  }

  // JOUEUR 2 FINI → RESULTAT FINAL
  scoreP2=score;
  document.getElementById("gameUI").classList.add("hidden");
  document.getElementById("duelResult").classList.remove("hidden");

  let text="🤝 Egalité";
  if(scoreP1>scoreP2) text="🏆 Joueur 1 gagne";
  if(scoreP2>scoreP1) text="🏆 Joueur 2 gagne";

  document.getElementById("winnerText").textContent=
    text+" ("+scoreP1+" vs "+scoreP2+")";
}
