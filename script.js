let sequence = [];
let player = [];
let level = 1;
let score = 0;
let timer;
let timeLeft = 10;

const colors = ["red", "green", "blue", "yellow"];

// 🔊 sons
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

    if (i >= sequence.length) {
      clearInterval(interval);
    }
  }, speed);

  // ✅ DELAI AJOUTÉ pour bien voir la dernière couleur
  setTimeout(() => {
    document.getElementById("flashGrid").style.display = "none";
    document.getElementById("answerBox").classList.remove("hidden");

    startTimer();
    document.getElementById("msg").textContent = "🎮 À toi !";
  }, sequence.length * speed + 600);
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
  }, 250);
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

  let correct = true;

  // ✅ vérification ordre exact
  if (player.length !== sequence.length) {
    correct = false;
  } else {
    for (let i = 0; i < sequence.length; i++) {
      if (player[i] !== sequence[i]) {
        correct = false;
        break;
      }
    }
  }

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
  clearInterval(timer);

  failSound.play();

  document.getElementById("msg").textContent =
    "❌ Game Over | Score: " + score;

  setTimeout(() => {
    startGame();
  }, 2000);
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}
