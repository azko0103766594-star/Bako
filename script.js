const app = document.getElementById("app");

/******** MENU ********/
function showMenu(){
  let best = localStorage.getItem("bestScore") || 0;

  app.innerHTML = `
    <div class="container">
      <h1>🎮 MINI GAMES</h1>
      <p>Joue • Bat ton record • Partage</p>

      <div class="card" onclick="startTapGame()">
        ⚡ Tap Tap Challenge
      </div>

      <h2>🏆 Record : ${best}</h2>
    </div>
  `;
}

/******** VARIABLES ********/
let score = 0;
let gameStarted = false;

/******** START GAME ********/
function startTapGame(){
  score = 0;
  gameStarted = false;

  app.innerHTML = `
    <div class="gameBox">
      <h1>⚡ TAP GAME</h1>
      <p>Tap le plus vite possible en 5 secondes</p>

      <h2 id="score">0</h2>

      <button class="mainBtn" onclick="tap()">TAP</button>

      <br><br>
      <button onclick="showMenu()">Menu</button>
    </div>
  `;
}

/******** TAP ********/
function tap(){
  if(!gameStarted){
    gameStarted = true;
    setTimeout(endGame, 5000);
  }

  score++;
  document.getElementById("score").textContent = score;
}

/******** RESULT ********/
function getRank(score){
  if(score <= 10) return "🐢 Lent";
  if(score <= 20) return "🙂 Normal";
  if(score <= 30) return "⚡ Rapide";
  if(score <= 40) return "🔥 Très rapide";
  return "👑 Machine";
}

/******** END GAME ********/
function endGame(){
  let best = localStorage.getItem("bestScore") || 0;
  let newRecord = false;

  if(score > best){
    localStorage.setItem("bestScore", score);
    best = score;
    newRecord = true;
  }

  let rank = getRank(score);

  app.innerHTML = `
    <div class="container">
      <h1>⏰ Fin du jeu</h1>

      <h2>Score : ${score}</h2>
      <h2>Record : ${best}</h2>

      <h2>${rank}</h2>

      ${newRecord ? "<h3>🔥 NOUVEAU RECORD !</h3>" : ""}

      <button onclick="startTapGame()">Rejouer</button>
      <button onclick="showMenu()">Menu</button>
    </div>
  `;
}

/******** SHARE ********/
function shareScore(){
  let best = localStorage.getItem("bestScore") || 0;

  let text = `J'ai fait ${best} sur Tap Game 😎🔥`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

/******** START ********/
showMenu();
