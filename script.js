let sequence = [];
let player = [];
let level = 1;
let score = 0;

let timer;
let timeLeft = 10;

let canCheck = true;
let canPlay = false;

const colors = ["red", "green", "blue", "yellow"];

// ===== MODE =====
let mode = "solo";

// ===== DUEL =====
let players = [];
let currentPlayer = 0;

// sons
const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

// ================= MENU =================
function selectMode(m) {
  mode = m;

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  if (mode === "solo") {
    startGame();
  }
}

function showDuelSetup() {
  document.getElementById("duelSetup").classList.remove("hidden");
}

// ================= DUEL START =================
function startDuel() {
  const p1 = document.getElementById("p1").value || "Joueur 1";
  const p2 = document.getElementById("p2").value || "Joueur 2";

  players = [
    { name: p1, score: 0 },
    { name: p2, score: 0 }
  ];

  currentPlayer = 0;

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  startGame();
}

// ================= GAME START =================
function startGame() {
  level = 1;
  score = 0;
  updateUI();
  nextRound();
}

// ================= ROUND =================
function nextRound() {
  player = [];
  sequence = [];
  canCheck = true;
  canPlay = false;

  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("msg").textContent = "👀 Observe bien !";

  if (mode === "duel") {
    document.getElementById("turnInfo").textContent =
      "🎮 Tour de : " + players[currentPlayer].name;
  }

  showSequence();
}

// ================= SHOW =================
function showSequence() {
  let speed = level > 7 ? 250 : 600;
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, speed);

  setTimeout(() => {
    document.getElementById("answerBox").classList.remove("hidden");
    canPlay = true;
    startTimer();
    document.getElementById("msg").textContent = "🎮 Reproduis la séquence";
  }, sequence.length * speed + 600);
}

// ================= FLASH =================
function flash(color) {
  let el = document.querySelector("." + color);
  el.classList.add("active");

  clickSound.currentTime = 0;
  clickSound.play();

  setTimeout(() => el.classList.remove("active"), 250);
}

// ================= PICK =================
function pick(color) {
  if (!canPlay) return;
  player.push(color);
}

// ================= TIMER =================
function startTimer() {
  clearInterval(timer);
  timeLeft = Math.max(2, 10 - level);

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

    if (timeLeft <= 0) check();
  }, 1000);
}

// ================= CHECK =================
function check() {
  if (!canCheck) return;
  canCheck = false;

  clearInterval(timer);

  let correct =
    player.length === sequence.length &&
    player.every((v, i) => v === sequence[i]);

  if (mode === "solo") {
    if (correct) {
      winSound.play();
      score += level * 10;
      level++;

      document.getElementById("msg").textContent = "Niveau suivant...";
      setTimeout(nextRound, 800);
    } else {
      gameOver();
    }
  }

  // ================= DUEL =================
  if (mode === "duel") {
    if (correct) {
      players[currentPlayer].score += level * 10;
      winSound.play();
    } else {
      failSound.play();
    }

    nextPlayer();
  }
}

// ================= NEXT PLAYER =================
function nextPlayer() {
  player = [];
  canCheck = true;
  canPlay = false;

  if (currentPlayer === 0) {
    currentPlayer = 1;
    document.getElementById("msg").textContent =
      "🎮 À " + players[1].name;
    setTimeout(nextRound, 1000);
  } else {
    // fin round
    if (players[0].score > players[1].score) {
      document.getElementById("msg").textContent =
        "🏆 Winner : " + players[0].name;
    } else if (players[1].score > players[0].score) {
      document.getElementById("msg").textContent =
        "🏆 Winner : " + players[1].name;
    } else {
      document.getElementById("msg").textContent = "⚖️ Égalité";
    }

    setTimeout(() => location.reload(), 3000);
  }
}

// ================= GAME OVER SOLO =================
function gameOver() {
  clearInterval(timer);
  failSound.play();

  document.getElementById("msg").textContent =
    "❌ Game Over | Score : " + score;

  setTimeout(startGame, 2000);
}

// ================= UI =================
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}
