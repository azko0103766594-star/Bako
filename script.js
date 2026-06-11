const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= CAMERA =================

let cameraX = 0;

// ================= PLAYER =================

const player = {
  x: 200,
  y: 0,
  width: 220,
  height: 300
};

// ================= GAME =================

let speed = 0;
let stamina = 100;
let boost = false;

// ================= SPRITE =================

let frame = 0;
let frameTimer = 0;

const FRAME_WIDTH = 192;
const FRAME_HEIGHT = 256;
const TOTAL_FRAMES = 8;

// ================= ASSETS =================

const assets = {};

function load(name, src) {

  const img = new Image();

  img.onload = () => {
    assets[name] = img;
    console.log(name + " chargé");
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

  boostBtn.addEventListener("touchstart", () => {
    boost = true;
  });

  boostBtn.addEventListener("touchend", () => {
    boost = false;
  });

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

  cameraX += speed;

  // Animation sprite

  frameTimer++;

  if (frameTimer >= 5) {

    frame++;
    frame %= TOTAL_FRAMES;

    frameTimer = 0;

  }

}

// ================= DRAW =================

function draw() {

  // Fond sombre

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stade

  if (assets.stadium) {

    ctx.drawImage(
      assets.stadium,
      -(cameraX * 0.15 % canvas.width),
      0,
      canvas.width * 2,
      250
    );

  }

  // Foule

  if (assets.crowd) {

    ctx.drawImage(
      assets.crowd,
      -(cameraX * 0.30 % canvas.width),
      60,
      canvas.width * 2,
      220
    );

  }

  // Piste infinie

  if (assets.track) {

    const trackWidth = canvas.width;

    for (let i = -1; i < 4; i++) {

      ctx.drawImage(
        assets.track,
        i * trackWidth - (cameraX % trackWidth),
        canvas.height - 180,
        trackWidth,
        180
      );

    }

  }

  // Joueur animé

  if (assets.player) {

    ctx.drawImage(
      assets.player,

      frame * FRAME_WIDTH,
      0,

      FRAME_WIDTH,
      FRAME_HEIGHT,

      player.x,
      canvas.height - 360,

      player.width,
      player.height
    );

  }

  // Barre stamina

  ctx.fillStyle = "#333";
  ctx.fillRect(20, 20, 250, 25);

  ctx.fillStyle = "lime";
  ctx.fillRect(20, 20, stamina * 2.5, 25);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText("STAMINA", 20, 15);

  // Vitesse

  ctx.fillText(
    "Speed : " + speed.toFixed(1),
    20,
    80
  );

}

// ================= LOOP =================

function loop() {

  update();
  draw();

  requestAnimationFrame(loop);

}

loop();

// ================= RESIZE =================

window.addEventListener("resize", () => {

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

});
