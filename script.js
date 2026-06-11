const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =======================
// RESIZE
// =======================

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =======================
// IMAGES
// =======================

const assets = {};

function load(name, src) {
    const img = new Image();

    img.onload = () => {
        console.log(name + " chargé");
    };

    img.src = src;
    assets[name] = img;
}

load("stadium1", "stadium1.png");
load("crowd", "crowd.png");
load("track", "track.png");
load("player", "player.png");

// =======================
// JOUEUR
// =======================

const player = {
    x: 180,
    y: 0,
    width: 120,
    height: 150
};

const TOTAL_FRAMES = 12;

let frame = 0;
let frameTimer = 0;

// =======================
// VARIABLES
// =======================

let cameraX = 0;
let speed = 0;
let stamina = 100;
let boost = false;
let distance = 0;

// =======================
// BOUTON BOOST
// =======================

const boostBtn = document.getElementById("boostBtn");

boostBtn.addEventListener("touchstart", () => boost = true);
boostBtn.addEventListener("touchend", () => boost = false);

boostBtn.addEventListener("mousedown", () => boost = true);
boostBtn.addEventListener("mouseup", () => boost = false);
boostBtn.addEventListener("mouseleave", () => boost = false);

// =======================
// UPDATE
// =======================

function update() {

    let targetSpeed = 7;

    if (boost && stamina > 0) {
        targetSpeed = 12;
        stamina -= 0.4;
    } else {
        stamina += 0.2;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    speed += (targetSpeed - speed) * 0.05;

    cameraX += speed;
    distance += speed * 0.05;

    let animationSpeed = boost ? 2 : 5;

    frameTimer++;

    if (frameTimer >= animationSpeed) {
        frame++;
        frameTimer = 0;

        if (frame >= TOTAL_FRAMES) {
            frame = 0;
        }
    }

    player.y = canvas.height - 250;
}

// =======================
// STADE
// =======================

function drawStadium() {

    if (!assets.stadium1.complete) return;

    const w = canvas.width;

    for (let i = -1; i < 3; i++) {

        ctx.drawImage(
            assets.stadium1,
            i * w - ((cameraX * 0.08) % w),
            0,
            w,
            260
        );

    }
}

// =======================
// PUBLIC
// =======================

function drawCrowd() {

    if (!assets.crowd.complete) return;

    const w = canvas.width;

    for (let i = -1; i < 3; i++) {

        ctx.drawImage(
            assets.crowd,
            i * w - ((cameraX * 0.15) % w),
            120,
            w,
            150
        );

    }
}

// =======================
// PISTE
// =======================

function drawTrack() {

    if (!assets.track.complete) return;

    const w = canvas.width;

    for (let i = -1; i < 5; i++) {

        ctx.drawImage(
            assets.track,
            i * w - (cameraX % w),
            canvas.height - 180,
            w,
            180
        );

    }
}

// =======================
// JOUEUR
// =======================

function drawPlayer() {

    if (!assets.player.complete) return;

    const frameWidth = assets.player.width / TOTAL_FRAMES;
    const frameHeight = assets.player.height;

    ctx.beginPath();
    ctx.ellipse(
        player.x + player.width / 2,
        player.y + player.height,
        40,
        12,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();

    ctx.drawImage(
        assets.player,
        frame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

// =======================
// HUD
// =======================

function drawHUD() {

    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    let color = "lime";

    if (stamina < 60) color = "orange";
    if (stamina < 25) color = "red";

    ctx.fillStyle = color;
    ctx.fillRect(20, 20, stamina * 3, 25);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 300, 25);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText("STAMINA", 20, 15);
    ctx.fillText("Vitesse : " + speed.toFixed(1), 20, 80);
    ctx.fillText("Distance : " + Math.floor(distance) + " m", 20, 110);
}

// =======================
// DRAW
// =======================

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStadium();
    drawCrowd();
    drawTrack();
    drawPlayer();
    drawHUD();
}

// =======================
// LOOP
// =======================

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
