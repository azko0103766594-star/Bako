let mode = "solo";

let sequence = [];
let player = [];
let level = 1;
let score = 0;

let p1 = "";
let p2 = "";
let currentPlayer = 1;

let timer;
let timeLeft = 10;

let canCheck = true;
let canPlay = false;

const colors = ["red", "green", "blue", "yellow"];

const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

// ================= MODE =================
function setMode(m) {
  mode = m;
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  startGame();
}

function showDuelSetup() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("duelSetup").classList.remove("hidden");
}

// ================= DUEL START =================
function startDuel() {
  p1 = document.getElementById("p1").value || "Joueur 1";
  p2 = document.getElementById("p2").value || "Joueur 2";

  currentPlayer = 1;

  document.getElementById("duelSetup").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  startGame();
}

// ================= START =================
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

  updateTurnText();

  document.getElementById("msg").textContent = "👀 Observe bien !";
  document.getElementById("flashGrid").style.display = "grid";
  document.getElementById("answerBox").classList.add("hidden");

  showSequence();
}

// ================= TURN TEXT =================
function updateTurnText() {
  if (mode === "solo") return;

  let name = currentPlayer === 1 ? p1 : p2;
  document.getElementById("turnText").textContent = "🎮 Tour de " + name;
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
    document.getElementById("flashGrid").style.display = "none";
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

  setTimeout(() => {
    el.classList.remove("active");
  }, 250);
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

  document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

    if (timeLeft <= 0) gameOver();
  }, 1000);
}

// ================= CHECK =================
function check() {
  if (!canCheck) return;
  canCheck = false;
  clearInterval(timer);

  let correct = JSON.stringify(player) === JSON.stringify(sequence);

  if (correct) {
    winSound.play();
    score += level * 10;
    level++;

    updateUI();

    document.getElementById("msg").textContent = "✔ Correct !";

    if (mode === "duel") {
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    setTimeout(nextRound, 800);
  } else {
    gameOver();
  }
}

// ================= GAME OVER =================
function gameOver() {
  clearInterval(timer);
  canPlay = false;

  failSound.play();

  if (mode === "duel") {
    let winner = currentPlayer === 1 ? p2 : p1;
    document.getElementById("msg").textContent =
      "🏆 " + winner + " gagne ! Score: " + score;
  } else {
    document.getElementById("msg").textContent =
      "❌ Game Over | Score : " + score;
  }

  setTimeout(() => location.reload(), 3000);
}

// ================= UI =================
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}
