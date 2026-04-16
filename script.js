let game = null;
let canPlay = false;

let clicks = 0;
let startTime = 0;

let sequence = [];
let playerIndex = 0;

const btn = document.getElementById("actionBtn");
const result = document.getElementById("result");

btn.addEventListener("click", handleClick);

function startGame(type) {
  game = type;
  canPlay = false;

  result.innerText = "";
  document.getElementById("gameBox").classList.remove("hidden");

  document.getElementById("gameTitle").innerText = type;
}

function handleClick() {
  if (!game) return;

  if (game === "clicker") clicker();
  if (game === "reaction") reaction();
  if (game === "memory") memory();
}

/* CLICKER */
function clicker() {
  if (btn.innerText === "START") {
    clicks = 0;
    canPlay = true;
    btn.innerText = "CLIQUE !";

    setTimeout(() => {
      canPlay = false;
      showResult("Click Speed", clicks + " clics");
    }, 5000);

  } else if (canPlay) {
    clicks++;
  }
}

/* REACTION */
function reaction() {
  if (btn.innerText === "START") {
    btn.innerText = "ATTENDS...";

    let delay = Math.random() * 3000 + 1500;

    setTimeout(() => {
      btn.innerText = "CLIQUE !";
      startTime = Date.now();
      canPlay = true;
    }, delay);

  } else if (canPlay) {
    let time = Date.now() - startTime;
    showResult("Reaction Time", time + " ms");
  }
}

/* MEMORY */
const colors = ["🔴", "🟡", "🔵", "🟢"];

function memory() {
  if (btn.innerText === "START") {
    sequence = [];
    playerIndex = 0;

    for (let i = 0; i < 4; i++) {
      sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    }

    btn.innerText = "WATCH";

    let i = 0;
    let show = setInterval(() => {
      btn.innerText = sequence[i];
      i++;

      if (i >= sequence.length) {
        clearInterval(show);
        setTimeout(() => {
          btn.innerText = "REPRODUIS";
          canPlay = true;
        }, 800);
      }
    }, 700);

  } else if (canPlay) {
    let chosen = colors[Math.floor(Math.random() * colors.length)];
    btn.innerText = chosen;

    if (chosen === sequence[playerIndex]) {
      playerIndex++;
      if (playerIndex === sequence.length) {
        showResult("Memory", "Perfect !");
      }
    } else {
      showResult("Memory", "Failed ❌");
    }
  }
}

/* RESULT */
function showResult(name, score) {
  result.innerText = `${name} : ${score}`;
  localStorage.setItem(name, score);

  btn.innerText = "START";
  canPlay = false;
        }
