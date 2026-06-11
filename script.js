const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= COURSE =================

let raceDistance = 10000;

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

// ================= STADES VIDEO =================

const stadiums = [
  document.getElementById("stadium1"),
  document.getElementById("stadium2"),
  document.getElementById("stadium3"),
  document.getElementById("stadium4")
];

let currentStadiumIndex = 0;
let currentStadium = stadiums[0];

let fadeAlpha = 0;
let fading = false;
let nextStadium = 0;

if (currentStadium) {
  currentStadium.play().catch(() => {});
}

function setStadium(index) {

  if (index === currentStadiumIndex) return;

  if (currentStadium) {
    currentStadium.pause();
  }

  currentStadiumIndex = index;
  currentStadium = stadiums[index];

  if (currentStadium) {
    currentStadium.currentTime = 0;
    currentStadium.play().catch(() => {});
  }

}

function transitionToStadium(index) {

  if (fading) return;

  nextStadium = index;
  fading = true;

}

// ================= ASSETS =================

const assets = {};

function load(name, src) {

  const img = new Image();

  img.onload = () => {
    assets[name] = img;
  };

  img.src = src;

}

load("crowd", "crowd.png");
load("track", "track.png");
load("player", "player.png");

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

}

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

  // Animation joueur

  frameTimer++;

  if (frameTimer >= 8) {

    frame++;

    if (frame >= TOTAL_FRAMES) {
      frame = 0;
    }

    frameTimer = 0;

  }

  // ================= PROGRESSION =================

  const progress = cameraX / raceDistance;

  if (raceDistance > 5000) {

    if (
      progress > 0.25 &&
      currentStadiumIndex === 0
    ) {
      transitionToStadium(1);
    }

    if (
      progress > 0.50 &&
      currentStadiumIndex === 1
    ) {
      transitionToStadium(2);
    }

    if (
      progress > 0.75 &&
      currentStadiumIndex === 2
    ) {
      transitionToStadium(3);
    }

  } else if (raceDistance > 1500) {

    if (
      progress > 0.33 &&
      currentStadiumIndex === 0
    ) {
      transitionToStadium(1);
    }

    if (
      progress > 0.66 &&
      currentStadiumIndex === 1
    ) {
      transitionToStadium(2);
    }

  } else if (raceDistance > 400) {

    if (
      progress > 0.50 &&
      currentStadiumIndex === 0
    ) {
      transitionToStadium(1);
    }

  }

  // ================= FONDU =================

  if (fading) {

    fadeAlpha += 0.03;

    if (fadeAlpha >= 1) {

      setStadium(nextStadium);

      fading = false;

    }

  } else if (fadeAlpha > 0) {

    fadeAlpha -= 0.03;

  }

}

// ================= DRAW =================

function draw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle = "#111";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // ================= STADE =================

  if (
    currentStadium &&
    currentStadium.readyState >= 2
  ) {

    ctx.drawImage(
      currentStadium,
      0,
      0,
      canvas.width,
      260
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
        i * trackWidth -
        (cameraX % trackWidth),
        canvas.height - 180,
        trackWidth,
        180
      );

    }

  }

  // ================= JOUEUR =================

  if (assets.player) {

    const frameWidth =
      assets.player.width /
      TOTAL_FRAMES;

    const frameHeight =
      assets.player.height;

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

  // ================= HUD =================

  ctx.fillStyle = "#333";
  ctx.fillRect(20, 20, 250, 25);

  ctx.fillStyle = "lime";
  ctx.fillRect(
    20,
    20,
    stamina * 2.5,
    25
  );

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";

  ctx.fillText(
    "STAMINA",
    20,
    15
  );

  ctx.fillText(
    "Speed : " +
    speed.toFixed(1),
    20,
    80
  );

  ctx.fillText(
    "Distance : " +
    Math.floor(cameraX) +
    " m",
    20,
    110
  );

  // ================= FONDU =================

  ctx.fillStyle =
    `rgba(0,0,0,${fadeAlpha})`;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
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

window.addEventListener(
  "resize",
  () => {

    canvas.width =
      window.innerWidth;

    canvas.height =
      window.innerHeight;

  }
);
