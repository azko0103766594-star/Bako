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

  if (game === "clicker") {
    document.getElementById("gameTitle").innerText = "🎯 Click Speed";
    document.getElementById("gameInfo").innerText = "Clique le plus vite en 5 secondes";
    btn.innerText = "START";
  }

  if (game === "reaction") {
    document.getElementById("gameTitle").innerText = "⚡ Reaction Time";
    document.getElementById("gameInfo").innerText = "Clique quand ça devient vert";
    btn.innerText = "START";
  }

  if (game === "memory") {
    document.getElementById("gameTitle").innerText = "🧠 Memory Flash";
    document.getElementById("gameInfo").innerText = "Retient la suite de couleurs";
    btn.innerText = "START";
  }
}

function handleClick() {
  if (!game) return;

  if (game === "clicker") clicker();
  if (game === "reaction") reaction();
  if (game === "memory") memory();
}

/* 🎯 CLICKER */
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

/* ⚡ REACTION */
function reaction() {
  if (btn.innerText === "START") {
    btn.innerText = "ATTENDS...";
    btn.style.background = "gray";

    let delay = Math.random() * 3000 + 1500;

    setTimeout(() => {
      btn.innerText = "CLIQUE !";
      btn.style.background = "green";
      startTime = Date.now();
      canPlay = true;
    }, delay);

  } else if (canPlay) {
    let time = Date.now() - startTime;
    showResult("Reaction Time", time + " ms");

    btn.style.background = "#28a745";
    canPlay = false;
  }
}

/* 🧠 MEMORY FLASH (UPGRADED) */
const colors = ["🔴", "🟡", "🔵", "🟢"];

function memory() {
  if (btn.innerText === "START") {
    sequence = [];
    playerIndex = 0;
    canPlay = false;

    btn.innerText = "WATCH";

    // génération séquence
    for (let i = 0; i < 4; i++) {
      sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    }

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
        showResult("Memory Flash", "Perfect !");
      }

    } else {
      showResult("Memory Flash", "Failed ❌");
    }
  }
}

/* 🏆 RESULT */
function showResult(gameName, score) {
  result.innerText = `${gameName} : ${score}`;
  localStorage.setItem(gameName, score);

  btn.innerText = "START";
  canPlay = false;
      }
