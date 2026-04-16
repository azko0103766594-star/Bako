let sequence = [];
let player = [];

let players = [];
let scores = [0, 0];
let currentPlayer = 0;

let level = 1;
let canPlay = false;
let canCheck = true;

const colors = ["red", "green", "blue", "yellow"];

const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

// 🎮 START DUEL
function startDuel() {
  let p1 = document.getElementById("p1").value || "Joueur 1";
  let p2 = document.getElementById("p2").value || "Joueur 2";

  players = [p1, p2];
  scores = [0, 0];
  level = 1;
  currentPlayer = 0;

  document.getElementById("setup").style.display = "none";

  nextTurn();
}

// 🔁 TOUR
function nextTurn() {
  player = [];
  sequence = [];
  canPlay = false;
  canCheck = true;

  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("turnText").textContent =
    "🎮 Tour de " + players[currentPlayer];

  document.getElementById("msg").textContent = "👀 Observe...";

  showSequence();
}

// 👀 AFFICHER SÉQUENCE
function showSequence() {
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;

    if (i >= sequence.length) clearInterval(interval);
  }, 500);

  setTimeout(() => {
    document.getElementById("msg").textContent = "🎮 À toi !";
    canPlay = true;
  }, sequence.length * 500);
}

// 💡 FLASH
function flash(color) {
  let el = document.querySelector("." + color);
  el.classList.add("active");
  clickSound.play();

  setTimeout(() => {
    el.classList.remove("active");
  }, 200);
}

// 👉 JOUEUR CLIQUE
function pick(color) {
  if (!canPlay) return;
  player.push(color);
}

// 🧠 CHECK
function check() {
  if (!canCheck) return;
  canCheck = false;

  let correct = JSON.stringify(player) === JSON.stringify(sequence);

  if (correct) {
    winSound.play();
    scores[currentPlayer] += 10 * level;
    document.getElementById("msg").textContent =
      "✔️ Bon " + players[currentPlayer];
  } else {
    failSound.play();
    document.getElementById("msg").textContent =
      "❌ Raté " + players[currentPlayer];
  }

  updateScore();

  // switch joueur
  currentPlayer++;

  if (currentPlayer >= players.length) {
    currentPlayer = 0;
    level++;
  }

  setTimeout(nextTurn, 1000);
}

// 📊 SCORE
function updateScore() {
  document.getElementById("s1").textContent = scores[0];
  document.getElementById("s2").textContent = scores[1];
}
