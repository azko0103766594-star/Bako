let sequence = [];
let player = [];

let level = 1;
let score = 0;

let timer;
let timeLeft = 10;

let canPlay = false;
let canCheck = true;

const colors = ["red", "green", "blue", "yellow"];

// 🎮 DUEL
let duelMode = false;
let players = [];
let duelScores = [0, 0];
let currentPlayer = 0;

// 🔊 sounds
const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");


// ================= SOLO =================
function startGame() {
  duelMode = false;
  level = 1;
  score = 0;
  updateUI();
  nextRound();
}


// ================= DUEL =================
function startDuel() {
  players = [
    document.getElementById("p1").value || "J1",
    document.getElementById("p2").value || "J2"
  ];

  duelScores = [0, 0];
  currentPlayer = 0;
  duelMode = true;

  document.getElementById("duelSetup").style.display = "none";

  startGame();
  updateTurn();
}


// ================= ROUND =================
function nextRound() {
  player = [];
  sequence = [];
  canPlay = false;
  canCheck = true;

  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("msg").textContent = "👀 Observe...";
  showSequence();
}


// ================= SHOW =================
function showSequence() {
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, 500);

  setTimeout(() => {
    canPlay = true;
    document.getElementById("msg").textContent = "🎮 À toi";
  }, sequence.length * 500);
}


// ================= FLASH =================
function flash(color) {
  let el = document.querySelector("." + color);
  el.classList.add("active");
  clickSound.play();

  setTimeout(() => el.classList.remove("active"), 200);
}


// ================= PICK =================
function pick(color) {
  if (!canPlay) return;
  player.push(color);
}


// ================= CHECK =================
function check() {
  if (!canCheck) return;
  canCheck = false;

  let correct = JSON.stringify(player) === JSON.stringify(sequence);

  if (correct) {
    winSound.play();

    if (duelMode) {
      duelScores[currentPlayer] += level * 10;
    } else {
      score += level * 10;
    }

    level++;

    document.getElementById("msg").textContent = "✔️ OK";

    if (duelMode) {
      currentPlayer = currentPlayer === 0 ? 1 : 0;
      updateTurn();
    }

    updateUI();
    updateDuelScore();
    setTimeout(nextRound, 800);

  } else {
    failSound.play();
    gameOver();
  }
}


// ================= GAME OVER =================
function gameOver() {
  document.getElementById("msg").textContent =
    "❌ Game Over";

  if (duelMode) {
    let winner =
      duelScores[0] > duelScores[1] ? players[0] :
      duelScores[1] > duelScores[0] ? players[1] :
      "Égalité";

    alert("🏆 Gagnant : " + winner);
  }
}


// ================= UI =================
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}

function updateTurn() {
  if (!duelMode) return;

  document.getElementById("turnText").textContent =
    "🎮 Tour de " + players[currentPlayer];
}

function updateDuelScore() {
  if (!duelMode) return;

  document.getElementById("duelScore").textContent =
    players[0] + " : " + duelScores[0] +
    " | " + players[1] + " : " + duelScores[1];
}
