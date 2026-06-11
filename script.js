// ================= CANVAS =================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// qualité (important pour éviter flou pixel)
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// ================= GAME =================

let raceDistance = 10000;
let cameraX = 0;

let speed = 0;
let stamina = 100;
let boost = false;

// ================= PLAYER =================

const player = { x: 200 };

// ================= ANIMATION =================

let frame = 0;
let frameTimer = 0;
const TOTAL_FRAMES = 9;

// ================= ASSETS =================

const assets = {};

function loadImage(name, src) {
  const img = new Image();
  img.onload = () => assets[name] = img;
  img.src = src;
}

loadImage("crowd", "crowd.png");
loadImage("track", "track.png");
loadImage("player", "player.png");

// ================= VIDEOS =================

const stadiums = [
  document.getElementById("stadium1"),
  document.getElementById("stadium2"),
  document.getElementById("stadium3"),
  document.getElementById("stadium4")
];

let currentIndex = 0;
let currentVideo = stadiums[0];

let fade = 0;
let fading = false;
let nextIndex = 0;

// sécurité mobile (IMPORTANT)
let running = true;

// démarrer vidéo
if (currentVideo) {
  currentVideo.play().catch(() => {});
}

// ================= VIDEO CONTROL =================

function pauseAllVideos() {
  stadiums.forEach(v => {
    if (v) v.pause(); // ❗ PAS reset currentTime (sinon crash mobile)
  });
}

function setVideo(index) {
  if (index === currentIndex) return;

  pauseAllVideos();

  currentIndex = index;
  currentVideo = stadiums[index];

  if (currentVideo) {
    currentVideo.play().catch(() => {});
  }
}

function changeVideo(index) {
  if (fading) return;

  nextIndex = index;
  fading = true;
}

// ================= INPUT BOOST =================

const boostBtn = document.getElementById("boostBtn");

function setBoost(state) {
  boost = state;
}

if (boostBtn) {
  ["touchstart", "mousedown"].forEach(e =>
    boostBtn.addEventListener(e, () => setBoost(true))
  );

  ["touchend", "touchcancel", "mouseup"].forEach(e =>
    boostBtn.addEventListener(e, () => setBoost(false))
  );
}

// ================= UPDATE =================

function update() {

  let targetSpeed = 6;

  if (boost && stamina > 0) {
    targetSpeed = 10;
    stamina -= 0.25;
  } else {
    stamina += 0.3;
  }

  stamina = Math.max(0, Math.min(100, stamina));

  speed += (targetSpeed - speed) * 0.03;
  cameraX += speed;

  // animation joueur
  frameTimer++;
  if (frameTimer > 8) {
    frame = (frame + 1) % TOTAL_FRAMES;
    frameTimer = 0;
  }

  // ================= PROGRESSION STADES =================

  const progress = cameraX / raceDistance;

  if (raceDistance > 5000) {

    if (progress > 0.25 && currentIndex === 0) changeVideo(1);
    if (progress > 0.50 && currentIndex === 1) changeVideo(2);
    if (progress > 0.75 && currentIndex === 2) changeVideo(3);

  } else if (raceDistance > 1500) {

    if (progress > 0.33 && currentIndex === 0) changeVideo(1);
    if (progress > 0.66 && currentIndex === 1) changeVideo(2);

  } else {

    if (progress > 0.5 && currentIndex === 0) changeVideo(1);
  }

  // ================= FADE =================

  if (fading) {

    fade += 0.03;

    if (fade >= 1) {
      setVideo(nextIndex);
      fading = false;
    }

  } else if (fade > 0) {
    fade -= 0.03;
  }
}

// ================= DRAW =================

function draw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ================= VIDEO (FIX NET + NO STRETCH =================

  if (currentVideo && currentVideo.readyState >= 2) {

    const h = 260;

    const vw = currentVideo.videoWidth || 1280;
    const vh = currentVideo.videoHeight || 720;

    const ratio = vw / vh;
    const w = h * ratio;

    const x = (canvas.width - w) / 2;

    ctx.drawImage(currentVideo, x, 0, w, h);
  }

  // ================= CROWD =================

  if (assets.crowd) {
    ctx.drawImage(
      assets.crowd,
      -(cameraX * 0.3 % canvas.width),
      80,
      canvas.width * 2,
      180
    );
  }

  // ================= TRACK =================

  if (assets.track) {

    const w = canvas.width;

    for (let i = -1; i < 4; i++) {
      ctx.drawImage(
        assets.track,
        i * w - (cameraX % w),
        canvas.height - 180,
        w,
        180
      );
    }
  }

  // ================= PLAYER =================

  if (assets.player) {

    const fw = assets.player.width / TOTAL_FRAMES;
    const fh = assets.player.height;

    ctx.drawImage(
      assets.player,
      frame * fw, 0,
      fw, fh,
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
  ctx.fillRect(20, 20, stamina * 2.5, 25);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";

  ctx.fillText("STAMINA", 20, 15);

  ctx.fillText("Speed: " + speed.toFixed(1), 20, 80);
  ctx.fillText("Distance: " + Math.floor(cameraX) + " m", 20, 110);

  // ================= FADE =================

  ctx.fillStyle = `rgba(0,0,0,${fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ================= LOOP (SAFE MOBILE =================

let last = 0;

function loop(t) {

  if (!running) return;

  if (t - last > 16) {
    update();
    draw();
    last = t;
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// ================= MOBILE SAFETY =================

document.addEventListener("visibilitychange", () => {

  running = !document.hidden;

  if (!running) {
    stadiums.forEach(v => v && v.pause());
  }
});
