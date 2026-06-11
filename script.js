const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= CAMERA =================
let cameraX = 0;

// ================= PLAYER =================
const player = {
  x: 200,
  width: 60,
  height: 100
};

// ================= GAME =================
let speed = 0;
let stamina = 100;
let boost = false;

const joy = { x: 1 };

// ================= ASSETS =================
const assets = {};

function load(name, src) {
  const img = new Image();

  img.onload = () => {
    assets[name] = img;
    console.log(name + " chargé ✅");
  };

  img.onerror = () => {
    console.log(name + " ERREUR ❌");
  };

  img.src = src;
}

load("stadium", "/stadium.png");
load("crowd", "/crowd.png");
load("track", "/track.png");
load("player", "/player.png");

// ================= BOOST =================
const boostBtn = document.getElementById("boostBtn");

if (boostBtn) {
  boostBtn.addEventListener("touchstart", () => boost = true);
  boostBtn.addEventListener("touchend", () => boost = false);
}

// ================= UPDATE =================
function update() {

  let targetSpeed = 6;

  if (boost && stamina > 0) {
    targetSpeed = 10;
    stamina -= 0.6;
  } else {
    stamina += 0.25;
  }

  stamina = Math.max(0, Math.min(100, stamina));

  speed += (targetSpeed - speed) * 0.08;

  // La caméra avance
  cameraX += speed;
}

// ================= DRAW =================
function draw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fond
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stade
  if (assets.stadium) {
    ctx.drawImage(
      assets.stadium,
      -(cameraX * 0.2 % canvas.width),
      0,
      canvas.width * 2,
      250
    );
  }

  // Foule
  if (assets.crowd) {
    ctx.drawImage(
      assets.crowd,
      -(cameraX * 0.4 % canvas.width),
      80,
      canvas.width * 2,
      180
    );
  }

  // Piste infinie
  if (assets.track) {

    const trackWidth = canvas.width;

    for (let i = -1; i < 4; i++) {

      ctx.drawImage(
        assets.track,
        i * trackWidth - (cameraX % trackWidth),
        canvas.height - 150,
        trackWidth,
        150
      );
    }
  }

  // Joueur
  if (assets.player) {

    ctx.drawImage(
  assets.player,
  0,        // x dans le sprite
  0,        // y dans le sprite
  384,      // largeur d'une frame
  512,      // hauteur d'une frame

  player.x,
  canvas.height - 220,
  80,
  120
);

  } else {

    ctx.fillStyle = "red";

    ctx.fillRect(
      player.x,
      canvas.height - 220,
      player.width,
      player.height
    );
  }

  // Barre stamina
  ctx.fillStyle = "#333";
  ctx.fillRect(20, 20, 200, 20);

  ctx.fillStyle = "lime";
  ctx.fillRect(20, 20, stamina * 2, 20);

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText("STAMINA", 20, 15);

  // Vitesse
  ctx.fillText(
    "Speed: " + speed.toFixed(1),
    20,
    65
  );
}

// ================= LOOP =================
function loop() {

  update();
  draw();

  requestAnimationFrame(loop);
}

loop();
