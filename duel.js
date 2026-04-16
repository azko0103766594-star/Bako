let sequence = [];
let player = [];
let level = 1;
let score = 0;

let players = [];
let turn = 0;

const colors = ["red","green","blue","yellow"];

function startGame() {
  players = [
    document.getElementById("p1").value || "J1",
    document.getElementById("p2").value || "J2"
  ];

  turn = 0;
  level = 1;
  score = 0;

  nextRound();
}

function nextRound() {
  player = [];
  sequence = [];

  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random()*4)]);
  }

  document.getElementById("turn").textContent =
    "🎮 Tour de " + players[turn];

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
    if (turn === 0) {
      turn = 1;
    } else {
      turn = 0;
      level++;
    }

    score += 10;
    nextRound();

  } else {
    document.getElementById("turn").textContent =
      "❌ Raté " + players[turn];

    turn = turn === 0 ? 1 : 0;
    setTimeout(nextRound, 1200);
  }
}