const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ======================
// RESIZE
// ======================

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize();

// ======================
// IMAGES
// ======================

const stadium = new Image();
stadium.src = "stadium1.png";

const playerSprite = new Image();
playerSprite.src = "player.png";

// ======================
// JOUEUR
// ======================

const player = {
    width: 80,
    height: 120,
    worldX: 0,
    worldY: 0
};

const TOTAL_FRAMES = 12;
const COLS = 4;
const ROWS = 3;

let frame = 0;
let frameTimer = 0;

// ======================
// COURSE
// ======================

let boost = false;
let stamina = 100;
let speed = 5;
let distance = 0;

// position sur la piste

let trackProgress = 0;

// ======================
// STADE
// ======================

const stadiumWidth = 1536;
const stadiumHeight = 864;

// centre du stade

const track = {
    cx: 768,
    cy: 432,
    rx: 500,
    ry: 205
};

// ======================
// CAMERA
// ======================

let cameraX = track.cx;
let cameraY = track.cy;

// ======================
// BOOST
// ======================

const boostBtn = document.getElementById("boostBtn");

boostBtn.addEventListener("touchstart", () => boost = true);
boostBtn.addEventListener("touchend", () => boost = false);

boostBtn.addEventListener("mousedown", () => boost = true);
boostBtn.addEventListener("mouseup", () => boost = false);
boostBtn.addEventListener("mouseleave", () => boost = false);

// ======================
// UPDATE
// ======================

function update() {

    if (boost && stamina > 0) {
        speed = 10;
        stamina -= 0.5;
    } else {
        speed = 5;
        stamina += 0.2;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    trackProgress += speed * 0.003;

    distance += speed * 0.1;

    player.worldX =
        track.cx +
        Math.cos(trackProgress) * track.rx;

    player.worldY =
        track.cy +
        Math.sin(trackProgress) * track.ry;

    cameraX += (player.worldX - cameraX) * 0.03;
cameraY += (player.worldY - cameraY) * 0.03;
    frameTimer++;

    if (frameTimer >= (boost ? 2 : 4)) {

        frame++;

        if (frame >= TOTAL_FRAMES) {
            frame = 0;
        }

        frameTimer = 0;
    }
}

// ======================
// STADE
// ======================

function drawStadium() {

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!stadium.complete) return;

    const zoom = 2.0;

    const drawX =
        canvas.width / 2 -
        cameraX * zoom;

    const drawY =
        canvas.height / 2 -
        cameraY * zoom;

    ctx.drawImage(
        stadium,
        drawX,
        drawY,
        stadiumWidth * zoom,
        stadiumHeight * zoom
    );
}

// ======================
// JOUEUR
// ======================

function drawPlayer() {

    const screenX = canvas.width * 0.35;
const screenY = canvas.height * 0.55;
    // Ombre

    ctx.beginPath();
    ctx.ellipse(
        screenX,
        screenY + 55,
        25,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    if (!playerSprite.complete || playerSprite.naturalWidth === 0) {

        ctx.fillStyle = "red";

        ctx.fillRect(
            screenX - 40,
            screenY - 60,
            80,
            120
        );

        return;
    }

    const frameWidth =
        playerSprite.width / COLS;

    const frameHeight =
        playerSprite.height / ROWS;

    const col = frame % COLS;
    const row = Math.floor(frame / COLS);

    const footX = screenX;
const footY = screenY + 20;

ctx.drawImage(
    playerSprite,
    col * frameWidth,
    row * frameHeight,
    frameWidth,
    frameHeight,

    footX - player.width / 2,
    footY - player.height,

    player.width,
    player.height
);
// ======================
// HUD
// ======================

function drawHUD() {

    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    let color = "lime";

    if (stamina < 60) color = "orange";
    if (stamina < 25) color = "red";

    ctx.fillStyle = color;
    ctx.fillRect(
        20,
        20,
        stamina * 3,
        25
    );

    ctx.strokeStyle = "white";
    ctx.strokeRect(
        20,
        20,
        300,
        25
    );

    ctx.fillStyle = "white";
    ctx.font = "22px Arial";

    ctx.fillText(
        "Distance : " +
        Math.floor(distance) +
        " m",
        20,
        80
    );

    ctx.fillText(
        "Vitesse : " +
        speed,
        20,
        120
    );
}

// ======================
// DRAW
// ======================

function draw() {

    drawStadium();
    drawPlayer();
    drawHUD();
}

// ======================
// LOOP
// ======================

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
