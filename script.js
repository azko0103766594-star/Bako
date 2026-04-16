let sequence = [];
let player = [];
let level = 1;
let score = 0;

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

  document.getElementById("msg").textContent = "👀 Observe la séquence";
  document.getElementById("answerBox").classList.add("hidden");

  showSequence();
}

function showSequence() {
  let i = 0;

  let speed = level > 7 ? 250 : 600;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, speed);

  setTimeout(() => {
    document.getElementById("answerBox").classList.remove("hidden");
    document.getElementById("msg").textContent = "🎮 Reproduis !";
  }, sequence.length * speed);
}

function flash(color) {
  let el = document.querySelector("." + color);
  el.classList.add("flash");

  clickSound.currentTime = 0;
  clickSound.play();

  setTimeout(() => {
    el.classList.remove("flash");
  }, 200);
}

/* 👉 clic joueur */
function addPick(color) {
  player.push(color);
  updatePreview();
}

/* affichage choix joueur */
function updatePreview() {
  let div = document.getElementById("preview");
  div.innerHTML = "";

  player.forEach(c => {
    let span = document.createElement("span");
    span.className = "tag";
    span.textContent = c;
    div.appendChild(span);
  });
}

function check() {
  let correct = true;

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

    document.getElementById("msg").textContent = "🔥 GAGNÉ !";

    updateUI();

    setTimeout(nextRound, 1200);
  } else {
    failSound.play();
    document.getElementById("msg").textContent =
      "❌ Perdu | Score: " + score;

    setTimeout(startGame, 2000);
  }
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
}
