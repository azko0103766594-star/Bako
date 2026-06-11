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

// ================= VIDEOS =================

// HTML requis :
// <video id="stadium1" autoplay muted loop playsinline style="display:none">
//   <source src="stadium1.mp4" type="video/mp4">
// </video>
//
// <video id="stadium2" muted loop playsinline style="display:none">
//   <source src="stadium2.mp4" type="video/mp4">
// </video>

const stadium1 = document.getElementById("stadium1");
const stadium2 = document.getElementById("stadium2");

let currentStadium = stadium1;

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

  boostBtn.addEventListener("touchcancel", () => {
    boost = false;
  });

  boostBtn.addEventListener("mousedown", () => {
    boost = true;
  });

  boostBtn.addEventListener("mouseup", () => {
    boost = false;
  });

  boostBtn.addEventListener("mouseleave", () => {
    boost = false;
  });
}

// ================= CHANGEMENT DE STADE =================

function changeStadium() {
  if (currentStadium === stadium1) {

    stadium1.pause();

    currentStadium = stadium2;

    currentStadium.currentTime = 0;

    currentStadium.play()
      .catch(err => console.log(err));

    console.log("Stade changé");
  }
}

// Changement après 30 secondes
setTimeout(changeStadium, 30000);

// ================= UPDATE =================

function update() {

  let targetSpeed = 6;

  if (boost && stamina > 0) {

    targetSpeed = 10;
    stamina -= 0.2;

  } else {

    stamina += 0.35;

  }

  stamina = Math.max(0, Math.min(100, stamina));

  speed += (targetSpeed - speed) * 0.03;

  cameraX += speed;

  frameTimer++;

  if (frameTimer >= 8) {

    frame++;

    if (frame >= TOTAL_FRAMES) {
      frame = 0;
    }

    frameTimer = 0;

  }
}

// ================= DRAW =================

function draw() {

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ================= STADE VIDEO =================

  if (currentStadium && currentStadium.readyState >= 2) {

    ctx.drawImage(
      currentStadium,
      0,
      0,
      canvas.width,
      250
    );

  }

  // ================= FOULE =================

  if (assets.crowd) {

    ctx.drawImage(
      assets.crowd,
      -(cameraX * 0.30 % canvas.width),
      80,
      canvas.width * 2,
      180
    );

  }

  // ================= PISTE =================

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

  // ================= JOUEUR =================

  if (assets.player) {

    const frameWidth = assets.player.width / TOTAL_FRAMES;
    const frameHeight = assets.player.height;

    ctx.drawImage(
      assets.player,
      frame * frameWidth,
      0,
      frameWidth,
      frameHeight,

      player.x,
      canvas.height - 280,

      180,
      220
    );

  }

  // ================= STAMINA =================

  ctx.fillStyle = "#333";
  ctx.fillRect(20, 20, 250, 25);

  ctx.fillStyle = "lime";
  ctx.fillRect(20, 20, stamina * 2.5, 25);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";

  ctx.fillText("STAMINA", 20, 15);

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
