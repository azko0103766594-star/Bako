const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 🎥 CAMERA
let cameraX = 0;

// 🏃 PLAYER
let player = {
  x: 200,
  y: canvas.height - 220
};

// ⚡ GAME STATE
let speed = 0;
let stamina = 100;
let boost = false;

// 🎮 AUTO RUN
let joy = { x: 1 };

// ================= ASSETS =================
const assets = {};

// 🔥 LOADER FIABLE
function load(name, src){
  const img = new Image();

  img.onload = () => {
    assets[name] = img;
    console.log(name + " chargé ✅");
  };

  img.onerror = () => {
    console.log(name + " ERREUR ❌ :", src);
  };

  img.src = src;
}

// 🏟️ IMAGES (Vercel root = /)
load("stadium", "/stadium.png");
load("track", "/track.png");
load("crowd", "/crowd.png");
load("player", "/player.png");

// ================= CONTROLS =================
const boostBtn = document.getElementById("boostBtn");

if (boostBtn) {
  boostBtn.addEventListener("touchstart", () => boost = true);
  boostBtn.addEventListener("touchend", () => boost = false);
}

// ================= UPDATE =================
function update(){

  let targetSpeed = joy.x * 6;

  // ⚡ BOOST
  if (boost && stamina > 0) {
    targetSpeed = 10;
    stamina -= 0.7;
  } else {
    stamina += 0.3;
  }

  stamina = Math.max(0, Math.min(100, stamina));

  // ⚡ smooth movement
  speed += (targetSpeed - speed) * 0.12;

  cameraX += speed;
  player.x += speed;
}

// ================= DRAW =================
function draw(){

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 🌌 BACKGROUND
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🏟️ STADIUM
  if (assets.stadium && assets.stadium.width > 0) {
    ctx.drawImage(
      assets.stadium,
      -cameraX * 0.3,
      0,
      canvas.width * 2,
      300
    );
  }

  // 👥 CROWD
  if (assets.crowd && assets.crowd.width > 0) {
    ctx.drawImage(
      assets.crowd,
      -cameraX * 0.4,
      80,
      canvas.width * 2,
      200
    );
  }

  // 🟫 TRACK
  if (assets.track && assets.track.width > 0) {
    ctx.drawImage(
      assets.track,
      -cameraX,
      canvas.height - 150,
      canvas.width * 3,
      150
    );
  }

  // 🏃 PLAYER
  if (assets.player && assets.player.width > 0) {
    ctx.drawImage(
      assets.player,
      player.x - cameraX,
      canvas.height - 220,
      60,
      100
    );
  } else {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x - cameraX, canvas.height - 220, 40, 80);
  }

  // ⚡ STAMINA BAR
  ctx.fillStyle = "green";
  ctx.fillRect(20, 20, stamina * 2, 10);

  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.fillText("STAMINA", 20, 15);
}

// ================= LOOP =================
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
