let sequence = [];
let player = [];
let level = 0;

let colors = ["red", "green", "blue", "yellow"];

let best = localStorage.getItem("bestMemory") || 0;
document.getElementById("best").textContent = best;

function startGame() {
  sequence = [];
  level = 0;
  nextLevel();
}

function nextLevel() {
  player = [];
  level++;
  document.getElementById("level").textContent = level;

  let next = colors[Math.floor(Math.random() * 4)];
  sequence.push(next);

  showSequence();
}

function showSequence() {
  let i = 0;
  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, 600);
}

function flash(color) {
  let btn = document.querySelector("." + color);
  btn.style.opacity = "1";
  setTimeout(() => btn.style.opacity = "0.8", 300);
}

function tap(color) {
  player.push(color);

  let index = player.length - 1;

  if (player[index] !== sequence[index]) {
    document.getElementById("msg").textContent = "Perdu ❌ Niveau " + level;

    if (level > best) {
      best = level;
      localStorage.setItem("bestMemory", best);
      document.getElementById("best").textContent = best;
    }

    return;
  }

  if (player.length === sequence.length) {
    setTimeout(nextLevel, 800);
  }
}
