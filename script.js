// ================= VARIABLES =================
let sequence = [];
let player = [];
let level = 1;
let score = 0;

let timer;
let timeLeft = 10;
let canCheck = true;
let canPlay = false;

const colors = ["red","green","blue","yellow"];

const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

// ===== MODE DUEL =====
let mode = "solo";
let currentPlayer = 1;
let scoresDuel = {1:0,2:0};
let names = {1:"Joueur 1",2:"Joueur 2"};

function setMode(m){
  mode = m;
  document.getElementById("modeTitle").textContent =
      m==="solo" ? "Mode Solo" : "Mode Duel";

  document.getElementById("nameBox").classList.toggle("hidden", m!=="duel");
}

function startDuel(){
  names[1] = document.getElementById("name1").value || "Joueur 1";
  names[2] = document.getElementById("name2").value || "Joueur 2";
  document.getElementById("nameBox").classList.add("hidden");
  document.getElementById("duelScores").classList.remove("hidden");
  startGame();
}

function startGame(){
  level=1; score=0;
  scoresDuel={1:0,2:0}; currentPlayer=1;
  updateUI(); updateDuelUI();
  nextRound();
}

function updateDuelUI(){
  if(mode!=="duel") return;
  document.getElementById("p1").textContent = names[1]+" : "+scoresDuel[1];
  document.getElementById("p2").textContent = names[2]+" : "+scoresDuel[2];
  document.getElementById("turnText").textContent =
    "Tour de "+names[currentPlayer];
}

function nextRound(){
  player=[]; sequence=[]; canCheck=true; canPlay=false;
  let length = 3+level;

  for(let i=0;i<length;i++)
    sequence.push(colors[Math.floor(Math.random()*4)]);

  document.getElementById("msg").textContent="👀 Observe !";
  document.getElementById("flashGrid").style.display="grid";
  document.getElementById("answerBox").classList.add("hidden");
  showSequence();
}

function showSequence(){
  let i=0;
  let interval=setInterval(()=>{
    flash(sequence[i]); i++;
    if(i>=sequence.length) clearInterval(interval);
  },600);

  setTimeout(()=>{
    document.getElementById("flashGrid").style.display="none";
    document.getElementById("answerBox").classList.remove("hidden");
    canPlay=true; startTimer();
  },sequence.length*600+600);
}

function flash(color){
  let el=document.querySelector("."+color);
  el.classList.add("active");
  clickSound.currentTime=0; clickSound.play();
  setTimeout(()=>el.classList.remove("active"),250);
}

function pick(color){
  if(!canPlay) return;
  player.push(color);
}

function startTimer(){
  clearInterval(timer);
  timeLeft=10;
  timer=setInterval(()=>{
    timeLeft--;
    document.getElementById("timer").textContent="⏱ "+timeLeft+"s";
    if(timeLeft<=0) gameOver();
  },1000);
}

function check(){
  clearInterval(timer);
  let correct = JSON.stringify(player)===JSON.stringify(sequence);

  if(correct){
    winSound.play();
    if(mode==="solo"){
      score+=level*10; level++;
      updateUI();
    }else{
      scoresDuel[currentPlayer]+=10;
      currentPlayer = currentPlayer===1?2:1;
      updateDuelUI();
    }
    setTimeout(nextRound,800);
  }else gameOver();
}

function gameOver(){
  failSound.play();
  if(mode==="solo"){
    document.getElementById("msg").textContent="Game Over score "+score;
    setTimeout(startGame,2000);
    return;
  }

  // FIN DU DUEL
  let winner = scoresDuel[1] > scoresDuel[2] ? names[1] : names[2];
  document.getElementById("msg").textContent = "🏆 "+winner+" a gagné !";
  setTimeout(startGame,3000);
}

function updateUI(){
  document.getElementById("score").textContent=score;
  document.getElementById("level").textContent=level;
}
