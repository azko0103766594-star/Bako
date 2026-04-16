let currentGame = null;
let canClick = false;
let clicks = 0;
let startTime = 0;

const btn = document.getElementById("actionBtn");
const result = document.getElementById("result");

function startGame(game) {
  currentGame = game;
  result.innerText = "";

  document.getElementById("gameBox").classList.remove("hidden");

  if (game === "clicker") {
    document.getElementById("gameTitle").innerText = "🎯 Click Speed";
    document.getElementById("gameInfo").innerText = "Clique le plus vite possible en 5 secondes";
    btn.innerText = "START";
  }

  if (game === "reaction") {
    document.getElementById("gameTitle").innerText = "⚡ Reaction Time";
    document.getElementById("gameInfo").innerText = "Clique dès que le bouton devient vert";
    btn.innerText = "START";
  }

  canClick = false;
}

/* 🔥 UN SEUL EVENT POUR TOUT */
btn.addEventListener("click", () => {
  if (!currentGame) return;

  if (currentGame === "clicker") clickerGame();
  if (currentGame === "reaction") reactionGame();
});

/* 🎯 CLICKER GAME */
function clickerGame() {
  if (btn.innerText === "START") {
    clicks = 0;
    canClick = true;
    btn.innerText = "CLIQUE !";

    setTimeout(() => {
      canClick = false;
      btn.innerText = "START";
      result.innerText = "Score: " + clicks;
    }, 5000);

  } else if (canClick) {
    clicks++;
  }
}

/* ⚡ REACTION GAME */
function reactionGame() {
  if (btn.innerText === "START") {
    btn.innerText = "ATTENDS...";
    btn.style.background = "gray";

    let delay = Math.random() * 3000 + 1500;

    setTimeout(() => {
      btn.innerText = "CLIQUE !";
      btn.style.background = "green";
      startTime = Date.now();
      canClick = true;
    }, delay);

  } else if (canClick && btn.innerText === "CLIQUE !") {
    let time = Date.now() - startTime;

    result.innerText = "Temps: " + time + " ms";

    btn.innerText = "START";
    btn.style.background = "#28a745";
    canClick = false;
  }
}
