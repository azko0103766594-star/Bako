const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= CAMERA =================

let cameraX = 0;

// ================= PLAYER =================

const player = {
  x: 200
};

// ================= GAME =================

let speed = 0;
let stamina = 100;
let boost = false;

// ================= SPRITE =================

let frame = 0;
let frameTimer = 0;

const TOTAL_FRAMES = 9;

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

  frameTimer++;

  if (frameTimer >= 5) {

    frame++;

    if (frame >= TOTAL_FRAMES) {
      frame = 0;
    }

    frameTimer = 0;

  }

}

// ================= DRAW =================

function draw() {

  // Fond noir
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
      80,
      canvas.width * 2,
      180
    );

  }

  // Piste
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

    const frameWidth = assets.player.width / 9;
    const frameHeight = assets.player.height;

    ctx.drawImage(
      assets.player,

      frame * frameWidth,
      0,

      frameWidth,
      frameHeight,

      player.x,
      canvas.height - 350,

      280,
      320
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
