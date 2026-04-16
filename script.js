let sequence = [];
let player = [];
let level = 1;
let score = 0;
let timeLeft = 5;
let timer;

const colors = ["red", "green", "blue", "yellow"];

function startGame() {
  level = 1;
  score = 0;
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;

  nextRound();
}

function nextRound() {
  player = [];
  sequence = [];

  let length = 3 + level; // difficulté augmente

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("msg").textContent = "Observe bien 👀";
  document.getElementById("flashGrid").style.display = "grid";
  document.getElementById("answerBox").classList.add("hidden");

  showSequence();
}

function showSequence() {
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, 700);

  setTimeout(() => {
    document.getElementById("flashGrid").style.display = "none";
    document.getElementById("answerBox").classList.remove("hidden");

    startTimer();
    document.getElementById("msg").textContent = "À toi 🎮";
  }, sequence.length * 700);
}

function flash(color) {
  let el = document.querySelector("." + color);
  el.style.opacity = "1";

  setTimeout(() => {
    el.style.opacity = "0";
  }, 300);
}

function pick(color) {
  if (player.includes(color)) {
    player = player.filter(c => c !== color);
  } else {
    player.push(color);
  }
}

function startTimer() {
  timeLeft = 5;
  document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = "⏱ " + timeLeft + "s";

    if (timeLeft <= 0) {
      clearInterval(timer);
      check();
    }
  }, 1000);
}

function check() {
  clearInterval(timer);

  let correct = true;

  if (player.length !== sequence.length) correct = false;

  sequence.forEach(c => {
    if (!player.includes(c)) correct = false;
  });

  if (correct) {
    score += 10;
    level++;
    document.getElementById("msg").textContent = "✅ Correct !";
  } else {
    document.getElementById("msg").textContent = "❌ Faux !";
  }

  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;

  setTimeout(nextRound, 1200);
}
