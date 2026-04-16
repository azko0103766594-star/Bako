let currentGame = "";
let startTime = 0;

function startGame(game) {
  currentGame = game;

  document.getElementById("gameBox").classList.remove("hidden");

  if (game === "clicker") {
    document.getElementById("gameTitle").innerText = "🎯 Click Speed";
    document.getElementById("gameInfo").innerText = "Clique le plus vite possible pendant 5 secondes";
    document.getElementById("actionBtn").innerText = "START";
  }

  if (game === "reaction") {
    document.getElementById("gameTitle").innerText = "⚡ Reaction Time";
    document.getElementById("gameInfo").innerText = "Attends le vert et clique vite !";
    document.getElementById("actionBtn").innerText = "START";
  }

  document.getElementById("result").innerText = "";
}

function gameAction() {
  if (currentGame === "clicker") clickerGame();
  if (currentGame === "reaction") reactionGame();
}

/* 🔥 GAME 1 */
let clicks = 0;
let timer;

function clickerGame() {
  clicks = 0;
  document.getElementById("actionBtn").innerText = "CLIQUE !";

  timer = setTimeout(() => {
    document.getElementById("result").innerText =
      "Score: " + clicks + " clics";

    saveScore("clicker", clicks);
  }, 5000);

  document.getElementById("actionBtn").onclick = () => {
    clicks++;
  };
}

/* ⚡ GAME 2 */
function reactionGame() {
  document.getElementById("actionBtn").innerText = "ATTENDS...";

  let wait = Math.random() * 3000 + 2000;

  setTimeout(() => {
    document.getElementById("actionBtn").innerText = "CLIQUE !";
    startTime = Date.now();

    document.getElementById("actionBtn").onclick = () => {
      let time = Date.now() - startTime;

      document.getElementById("result").innerText =
        "Temps: " + time + " ms";

      saveScore("reaction", time);
    };
  }, wait);
}

/* 💾 SCORE LOCAL */
function saveScore(game, score) {
  localStorage.setItem(game, score);
}
