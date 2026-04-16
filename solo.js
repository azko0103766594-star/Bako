let sequence = [];
let player = [];
let level = 1;
let score = 0;

const colors = ["red","green","blue","yellow"];

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
    sequence.push(colors[Math.floor(Math.random()*4)]);
  }

  document.getElementById("msg").textContent = "👀 Observe";

  show();
}

function show() {
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, 500);
}

function flash(c) {
  let el = document.querySelector("." + c);
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), 200);
}

function pick(c) {
  player.push(c);
}

function check() {
  let ok = JSON.stringify(player) === JSON.stringify(sequence);

  if (ok) {
    score += 10;
    level++;
    updateUI();
    document.getElementById("msg").textContent = "✅ Bon";
    setTimeout(nextRound, 800);
  } else {
    document.getElementById("msg").textContent = "❌ Perdu";
  }
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}