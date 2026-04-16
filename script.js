let sequence = [];
let player = [];

const colors = ["red", "green", "blue", "yellow"];

function startGame() {
  sequence = [];
  player = [];

  document.getElementById("msg").textContent = "Regarde bien 👀";

  generateSequence();
  showSequence();
}

function generateSequence() {
  sequence = [];

  // 4 couleurs aléatoires
  for (let i = 0; i < 4; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }
}

function showSequence() {
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) clearInterval(interval);
  }, 700);

  // après 4 secondes → cacher + question
  setTimeout(() => {
    document.getElementById("flashGrid").style.display = "none";
    document.getElementById("answerBox").classList.remove("hidden");
    document.getElementById("msg").textContent = "À toi 🎮";
  }, 4000);
}

function flash(color) {
  let el = document.querySelector("." + color);
  el.style.opacity = "1";

  setTimeout(() => {
    el.style.opacity = "0";
  }, 400);
}

function pick(color) {
  if (player.includes(color)) {
    player = player.filter(c => c !== color);
  } else {
    player.push(color);
  }
}

function check() {
  let correct = true;

  if (player.length !== sequence.length) correct = false;

  sequence.forEach(c => {
    if (!player.includes(c)) correct = false;
  });

  document.getElementById("msg").textContent =
    correct ? "✅ Correct !" : "❌ Faux !";

  resetGame();
}

function resetGame() {
  document.getElementById("flashGrid").style.display = "grid";
  document.getElementById("answerBox").classList.add("hidden");
}
