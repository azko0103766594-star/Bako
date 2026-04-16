<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ Viral Mini Games</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>

<header>
  <h1>⚡ Viral Mini Games</h1>
  <p>Joue • Score • Partage • Devient viral</p>
</header>

<main>

  <!-- MENU -->
  <section class="menu">
    <button onclick="startGame('clicker')">🎯 Click Speed</button>
    <button onclick="startGame('reaction')">⚡ Reaction Time</button>
    <button onclick="startGame('memory')">🧠 Memory Tap</button>
  </section>

  <!-- GAME BOX -->
  <section id="gameBox" class="game-box hidden">

    <h2 id="gameTitle"></h2>
    <p id="gameInfo"></p>

    <button id="actionBtn">START</button>

    <h3 id="result"></h3>

    <button id="shareBtn" class="share hidden">📤 Share score</button>

  </section>

</main>

<script src="app.js"></script>
</body>
</html>
