// ================= VARIABLES =================
let sequence = [];
let player = [];
let level = 1;
let score = 0;

let timer;
let timeLeft = 10;

let canCheck = true;
let canPlay = false;

const colors = ["red", "green", "blue", "yellow"];

// 🔊 Sons
const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const failSound = document.getElementById("failSound");


// ================= START GAME =================
function startGame() {
  level = 1;
  score = 0;
  updateUI();
  nextRound();
}


// ================= NEW ROUND =================
function nextRound() {
  player = [];
  sequence = [];
  canCheck = true;
  canPlay = false;

  // longueur augmente avec niveau
  let length = 3 + level;

  for (let i = 0; i < length; i++) {
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  document.getElementById("msg").textContent = "👀 Observe bien !";
  document.getElementById("flashGrid").style.display = "grid";
  document.getElementById("answerBox").classList.add("hidden");

  showSequence();
}


// ================= SHOW SEQUENCE =================
function showSequence() {
  let speed = level > 7 ? 250 : 600;
  let i = 0;

  let interval = setInterval(() => {
    flash(sequence[i]);
    i++;

    if (i >= sequence.length) clearInterval(interval);
  }, speed);

  // passage phase réponse
  setTimeout(() => {
    document.getElementById("flashGrid").style.display = "none";
    document.getElementById("answerBox").classList.remove("hidden");

    canPlay = true;
    startTimer();

    document.getElementById("msg").textContent = "🎮 Reproduis la séquence";
  }, sequence.length * speed + 600);
}


// ================= FLASH COLOR =================
function flash(color) {
  let el = document.querySelector("." + color);

  el.classList.add("active");
  clickSound.currentTime = 0;
  clickSound.play();

  document.body.classList.add("flash");

  setTimeout(() => {
    el.classList.remove("active");
    document.body.classList.remove("flash");
