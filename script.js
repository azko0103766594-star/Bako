const app = document.getElementById("app");

/******** MENU ********/
function showMenu(){
  let best = localStorage.getItem("bestScore") || 0;

  app.innerHTML = `
    <div class="container">
      <h1>🎮 MINI GAMES</h1>
      <p>Joue • Bat ton score • Partage 🔥</p>

      <div class="card" onclick="startTapGame()">
        ⚡ Tap Tap Challenge
      </div>

      <h3>🏆 Record : ${best}</h3>
    </div>
  `;
}

/******** TAP GAME ********/
let score = 0;
let gameStarted = false;

function startTapGame(){
  score = 0;
  gameStarted = false;

  app.innerHTML = `
    <div class="gameBox">
      <h1>⚡ TAP TAP</h1>
      <p>Clique le plus vite possible en 5 secondes</p>
      <h2 id="score">0</h2>
      <button class="mainBtn" onclick="tap()">TAP !</button>
      <br><br>
      <button onclick="showMenu()">Menu</button>
    </div>
  `;
}

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
  if(score <= 10) return "🐢 Escargot";
  if(score <= 20) return "🙂 Débutant";
  if(score <= 30) return "⚡ Rapide";
  if(score <= 40) return "🔥 Pro";
  return "👑 Machine";
}

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
    <h1>⏰ Temps écoulé !</h1>
    <h2>Score : ${score}</h2>
    <h3>Record : ${best}</h3>
    <h2>${rank}</h2>
    ${newRecord ? "<h3>🔥 NOUVEAU RECORD 🔥</h3>" : ""}

    <button onclick="startTapGame()">🔁 Rejouer</button>
    <button onclick="shareScore()">📤 Partager</button>
    <button onclick="showMenu()">🏠 Menu</button>
  `;
}

/******** SHARE ********/
function shareScore(){
  let best = localStorage.getItem("bestScore");

  let text = `Je viens de faire ${best} taps 😎🔥
Peux-tu battre mon score ?
https://tonsite.com`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

showMenu();
