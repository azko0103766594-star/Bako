const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =======================
// CANVAS
// =======================

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// =======================
// ASSETS
// =======================

const assets = {};

function load(name, src) {
    const img = new Image();
    img.src = src;
    assets[name] = img;
}

load("stadium1", "stadium1.png");
load("crowd", "crowd.png");
load("track", "track.png");
load("player", "player.png");

// =======================
// PLAYER
// =======================

const player = {
    x: 180,
    y: 0,
    width: 180,
    height: 220
};

const TOTAL_FRAMES = 9;
let frame = 0;
let frameTimer = 0;

// =======================
// GAME
// =======================

let cameraX = 0;
let speed = 0;
let boost = false;
let stamina = 100;
let distance = 0;

// =======================
// BOOST
// =======================

const boostBtn = document.getElementById("boostBtn");

boostBtn.addEventListener("touchstart", () => boost = true);
boostBtn.addEventListener("touchend", () => boost = false);
boostBtn.addEventListener("touchcancel", () => boost = false);

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
        stamina -= 0.35;

    } else {

        stamina += 0.20;

    }

    stamina = Math.max(0, Math.min(100, stamina));

    speed += (targetSpeed - speed) * 0.04;

    cameraX += speed;
    distance += speed * 0.05;

    // Animation sprite

    frameTimer++;

    if (frameTimer >= 6) {

        frame++;
        frameTimer = 0;

        if (frame >= TOTAL_FRAMES) {
            frame = 0;
        }

    }

    player.y = canvas.height - 280;

}

// =======================
// DRAW STADIUM
// =======================

function drawStadium() {

    if (!assets.stadium1.complete) return;

    const width = canvas.width;

    for (let i = -1; i < 3; i++) {

        ctx.drawImage(
            assets.stadium1,
            i * width - ((cameraX * 0.08) % width),
            0,
            width,
            260
        );

    }

}

// =======================
// DRAW CROWD
// =======================

function drawCrowd() {

    if (!assets.crowd.complete) return;

    const width = canvas.width;

    for (let i = -1; i < 3; i++) {

        ctx.drawImage(
            assets.crowd,
            i * width - ((cameraX * 0.15) % width),
            120,
            width,
            150
        );

    }

}

// =======================
// DRAW TRACK
// =======================

function drawTrack() {

    if (!assets.track.complete) return;

    const width = canvas.width;

    for (let i = -1; i < 5; i++) {

        ctx.drawImage(
            assets.track,
            i * width - (cameraX % width),
            canvas.height - 180,
            width,
            180
        );

    }

}

// =======================
// DRAW PLAYER
// =======================

function drawPlayer() {

    if (!assets.player.complete) return;

    const frameWidth = assets.player.width / TOTAL_FRAMES;
    const frameHeight = assets.player.height;

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

    // Ombre

    ctx.beginPath();
    ctx.ellipse(
        player.x + 90,
        player.y + 220,
        45,
        12,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

}

// =======================
// HUD
// =======================

function drawHUD() {

    // Fond stamina

    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    // Barre stamina

    let color = "lime";

    if (stamina < 60) color = "orange";
    if (stamina < 25) color = "red";

    ctx.fillStyle = color;
    ctx.fillRect(20, 20, stamina * 3, 25);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 300, 25);

    // Textes

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText("STAMINA", 20, 15);

    ctx.fillText(
        "Vitesse : " + speed.toFixed(1),
        20,
        80
    );

    ctx.fillText(
        "Distance : " + Math.floor(distance) + " m",
        20,
        110
    );

}

// =======================
// DRAW
// =======================

function draw() {

    // Ciel

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawStadium();
    drawCrowd();
    drawTrack();
    drawPlayer();
    drawHUD();

}

// =======================
// LOOP
// =======================

function gameLoop() {

    update();
    draw();

    requestAnimationFrame(gameLoop);

}

gameLoop();
