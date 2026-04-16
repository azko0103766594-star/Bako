let sequence = [];
let player = [];
let canPlay = false;

let level = 1;
let score = 0;
let timer;
let timeLeft = 10;

const colors = ["red", "green", "blue", "yellow"];

const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

let best = localStorage.getItem("best") || 0;
document.getElementById("best").textContent = best;

function startGame() {
  level = 1;
  score = 0;
  nextRound();
}

function nextRound() {
  sequence = [];
  player = [];
  canPlay = false;

  document.getElementById("level").textContent = level;

  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("msg").textContent = "👀 Observe";

  showSequence();
}

function showSequence() {
  let speed = Math.max(200, 700 - level * 50);

  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, speed);

  setTimeout(() => {
    canPlay = true;
    startTimer();
    document.getElementById("msg").textContent = "🎮 À toi !";
  }, sequence.length * speed + 500);
}

function flash(color) {
  let el = document.querySelector("." + color);

  el.classList.add("active");

  clickSound.currentTime = 0;
  clickSound.play();

  if (navigator.vibrate) navigator.vibrate(40);

  setTimeout(() => {
    el.classList.remove("active");
  }, 200);
}

function pick(color) {
  if (!canPlay) return;

  player.push(color);

  let i = player.length - 1;

  if (player[i] !== sequence[i]) {
    gameOver();
    return;
  }

  if (player.length === sequence.length) {
    winRound();
  }
}

function startTimer() {
  clearInterval(timer);

  timeLeft = Math.max(2, 8 - level);

  document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

    if (timeLeft <= 0) {
      gameOver();
    }
  }, 1000);
}

function winRound() {
  clearInterval(timer);

  winSound.play();

  score += level * 10;
  level++;

  document.getElementById("score").textContent = score;

  if (score > best) {
    best = score;
    localStorage.setItem("best", best);
    document.getElementById("best").textContent = best;
  }

  document.getElementById("msg").textContent = "🔥 Gagné !";

  setTimeout(nextRound, 1000);
}

function gameOver() {
  clearInterval(timer);

  failSound.play();

  canPlay = false;

  document.getElementById("msg").textContent =
    "❌ Perdu | Score: " + score;

  setTimeout(() => {
    startGame();
  }, 2000);
}
