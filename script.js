let sequence = [];
let player = [];
let level = 0;
let canPlay = false;

const colors = ["red", "green", "blue", "yellow"];

let best = localStorage.getItem("bestMemory") || 0;
document.getElementById("best").textContent = best;

function startGame() {
  sequence = [];
  level = 0;
  document.getElementById("msg").textContent = "Regarde bien 👀";
  nextLevel();
}

function nextLevel() {
  player = [];
  level++;
  document.getElementById("level").textContent = level;

  let next = colors[Math.floor(Math.random() * colors.length)];
  sequence.push(next);

  showSequence();
}

function showSequence() {
  canPlay = false;
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;

    if (i >= sequence.length) {
      clearInterval(interval);
      canPlay = true;
      document.getElementById("msg").textContent = "À toi de jouer 🎮";
    }
  }, 700);
}

function flash(color) {
  let btn = document.querySelector("." + color);
  btn.classList.add("active");

  setTimeout(() => {
    btn.classList.remove("active");
  }, 300);
}

function tap(color) {
  if (!canPlay) return;

  player.push(color);

  let index = player.length - 1;

  if (player[index] !== sequence[index]) {
    gameOver();
    return;
  }

  if (player.length === sequence.length) {
    setTimeout(nextLevel, 800);
  }
}

function gameOver() {
  canPlay = false;

  document.getElementById("msg").textContent =
    "Perdu ❌ Niveau " + level;

  if (level > best) {
    best = level;
    localStorage.setItem("bestMemory", best);
    document.getElementById("best").textContent = best;
  }
}
