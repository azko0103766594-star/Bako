let sequence = [];
let player = [];

let level = 1;
let timer;
let timeLeft = 10;

let mode = "solo";
let currentPlayer = "p1";

let players = {
  p1: { name: "J1", score: 0, diff: 0 },
  p2: { name: "J2", score: 0, diff: 0 }
};

const colors = ["red","green","blue","yellow"];

const p1Sound = document.getElementById("p1Sound");
const p2Sound = document.getElementById("p2Sound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

function setMode(m){
  mode = m;

  players.p1.name = document.getElementById("p1").value || "J1";
  players.p2.name = document.getElementById("p2").value || "J2";

  if(mode === "duel"){
    document.getElementById("vsScreen").classList.remove("hidden");

    setTimeout(()=>{
      document.getElementById("vsScreen").classList.add("hidden");
      startGame();
    }, 1500);
  }
}

function startGame(){
  level = 1;
  players.p1.score = 0;
  players.p2.score = 0;
  currentPlayer = "p1";

  document.getElementById("replayBtn").classList.add("hidden");

  nextRound();
}

function nextRound(){
  player = [];
  sequence = [];

  let len = 3 + level;

  for(let i=0;i<len;i++){
    sequence.push(colors[Math.floor(Math.random()*4)]);
  }

  document.getElementById("msg").textContent =
    mode==="duel" ? "Tour de "+players[currentPlayer].name : "Observe";

  showSeq();
}

function showSeq(){
  let i=0;

  let interval = setInterval(()=>{
    flash(sequence[i]);
    i++;
    if(i>=sequence.length) clearInterval(interval);
  }, 500);

  setTimeout(()=>{
    startTimer();
  }, sequence.length*500);
}

function flash(c){
  let el = document.querySelector("."+c);
  el.classList.add("active");

  if(currentPlayer==="p1") p1Sound.play();
  else p2Sound.play();

  setTimeout(()=>el.classList.remove("active"),200);
}

function pick(c){
  player.push(c);
}

function startTimer(){
  timeLeft = 8;
  timer = setInterval(()=>{
    timeLeft--;
    if(timeLeft<=0) gameOver();
  },1000);
}

function check(){
  clearInterval(timer);

  let ok = JSON.stringify(player)===JSON.stringify(sequence);

  if(ok){
    winSound.play();

    players[currentPlayer].score += level*10;

    level++;

    if(mode==="duel"){
      currentPlayer = currentPlayer==="p1"?"p2":"p1";
    }

    updateUI();
    nextRound();
  } else {
    gameOver();
  }
}

function gameOver(){
  clearInterval(timer);
  failSound.play();

  if(mode==="solo"){
    document.getElementById("msg").textContent =
      "Game Over";
  } else {
    let winner =
      players.p1.score > players.p2.score ?
      players.p1.name : players.p2.name;

    document.getElementById("msg").textContent =
      "🏆 Winner : "+winner;

    document.getElementById("replayBtn").classList.remove("hidden");
  }
}

function updateUI(){
  if(mode==="solo"){
    document.getElementById("score").textContent = "Score";
  } else {
    document.getElementById("score").textContent =
      players.p1.name+" "+players.p1.score+" | "+players.p2.name+" "+players.p2.score;

    document.getElementById("turn").textContent =
      "Tour : "+players[currentPlayer].name;
  }

  document.getElementById("level").textContent = level;
}
