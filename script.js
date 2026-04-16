let sequence = [];
let player = [];
let level = 1;
let score = 0;
let timer;
let timeLeft = 10;

const colors = ["red", "green", "blue", "yellow"];

const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");

function startGame() {
  level = 1;
  score = 0;

  updateUI();
  nextRound();
}

function nextRound() {
  player = [];
  sequence = [];

  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("msg").textContent = "👀 Observe bien !";
  document.getElementById("flashGrid").style.display = "grid";
  document.getElementById("answerBox").classList.add("hidden");

  showSequence();
}

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

    startTimer();
    document.getElementById("msg").textContent = "🎮 À toi !";
  }, sequence.length * speed);
}

function flash(color) {
  let el = document.querySelector("." + color);
  el.classList.add("active");

  clickSound.currentTime = 0;
  clickSound.play();

  document.body.classList.add("flash");

  setTimeout(() => {
    el.classList.remove("active");
    document.body.classList.remove("flash");
  }, 200);
}

function pick(color) {
  if (player.includes(color)) {
    player = player.filter(c => c !== color);
  } else {
    player.push(color);
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

function check() {
  clearInterval(timer);

  let correct =
    player.length === sequence.length &&
    sequence.every(c => player.includes(c));

  if (correct) {
    winSound.play();

    score += level * 10;
    level++;

    updateUI();
    document.getElementById("msg").textContent = "🔥 Correct !";

    setTimeout(nextRound, 1000);
  } else {
    gameOver();
  }
}

function gameOver() {
  failSound.play();

  document.getElementById("msg").textContent =
    "❌ Perdu | Score: " + score;

  setTimeout(() => {
    startGame();
  }, 2000);
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}
