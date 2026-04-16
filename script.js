let sequence = [];
let player = [];
let canPlay = false;

let mode = "normal";
let level = 1;
let timer;
let timeLeft = 10;

const colors = ["red", "green", "blue", "yellow"];

const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

function setMode(m) {
  mode = m;
}

function startGame() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  level = 1;
  nextRound();
}

function getSpeed() {
  if (mode === "easy") return 800;
  if (mode === "normal") return 600;
  if (mode === "hard") return 300;
  if (mode === "insane") return 150;
  return 600;
}

function nextRound() {
  sequence = [];
  player = [];
  canPlay = false;

  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("msg").textContent = "👀 Observe";
  showSequence();
}

function showSequence() {
  let speed = getSpeed();

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

  timeLeft = Math.max(2, 10 - level);

  document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

    if (timeLeft <= 0) {
      clearInterval(timer);
      gameOver();
    }
  }, 1000);
}

function winRound() {
  clearInterval(timer);

  winSound.play();

  level++;

  document.getElementById("msg").textContent = "🔥 Gagné !";

  setTimeout(nextRound, 1000);
}

function gameOver() {
  clearInterval(timer);

  failSound.play();

  canPlay = false;

  document.getElementById("msg").textContent = "❌ Perdu";

  setTimeout(() => {
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("game").classList.add("hidden");
  }, 2000);
}
