window.onerror = function(msg) {
    alert(msg);
};
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

stadium.onload = () => {
    console.log("Largeur :", stadium.width);
    console.log("Hauteur :", stadium.height);
};

stadium.src = "stadium1.png";
const playerSprite = new Image();
playerSprite.src = "player.png";
// ======================
// JOUEUR
// ======================

const player = {
    width: 80,
    height: 120,
    worldX: 768,
    worldY: 692
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
const stadiumHeight = 1024;
// centre du stade

const track = {
    cx: 768,
    cy: 512,

    // taille de l’ovale
    rx: 600,
    ry: 260
};
// ======================
// CAMERA
// ======================

const cameras = [
{
    x: 350,
    y: 760
},
{
    x: 1180,
    y: 760
},
{
    x: 1180,
    y: 260
},
{
    x: 350,
    y: 260
}
];

let activeCamera = 0;

let cameraX = cameras[0].x;
let cameraY = cameras[0].y;

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

// ======================
// POSITION JOUEUR (ellipse)
// ======================
player.worldX =
    track.cx + Math.cos(trackProgress) * track.rx;

player.worldY =
    track.cy + Math.sin(trackProgress) * track.ry;

// ======================
// CAMERA (ANGLE PROPRE)
// ======================
const angle = Math.atan2(
    player.worldY - track.cy,
    player.worldX - track.cx
);

let normalizedAngle = angle;
if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

// 4 caméras fluides autour de la piste
if (normalizedAngle < Math.PI / 2) {
    activeCamera = 0;
}
else if (normalizedAngle < Math.PI) {
    activeCamera = 1;
}
else if (normalizedAngle < (3 * Math.PI) / 2) {
    activeCamera = 2;
}
else {
    activeCamera = 3;
}

// ======================
// CAMERA SMOOTH FOLLOW
// ======================
const targetX =
    cameras[activeCamera].x +
    (player.worldX - cameras[activeCamera].x) * 0.25;

const targetY =
    cameras[activeCamera].y +
    (player.worldY - cameras[activeCamera].y) * 0.25;

cameraX += (targetX - cameraX) * 0.05;
cameraY += (targetY - cameraY) * 0.05;

// ======================
// ANIMATION SPRITE
// ======================
frameTimer++;

if (frameTimer >= (boost ? 2 : 4)) {

    frame++;

    if (frame >= TOTAL_FRAMES) {
        frame = 0;
    }

    frameTimer = 0;
}

// ======================
// STADE
// ======================

function drawStadium() {

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!stadium.complete) return;

    const zoom = 2.0;

    const drawX = canvas.width / 2 - cameraX * zoom;
const drawY = canvas.height / 2 - cameraY * zoom;
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

    const screenX = canvas.width / 2;
    const screenY = canvas.height / 2;

    ctx.beginPath();

    ctx.ellipse(
        screenX,
        screenY + 110,
        45,
        15,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    if (!playerSprite.complete || playerSprite.naturalWidth === 0) {

        ctx.fillStyle = "red";
        ctx.fillRect(
            screenX - 50,
            screenY - 100,
            100,
            200
        );

        return;
    }

    const frameWidth =
        playerSprite.width / COLS;

    const frameHeight =
        playerSprite.height / ROWS;

    const col = frame % COLS;
    const row = Math.floor(frame / COLS);

    ctx.drawImage(
        playerSprite,
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,

        screenX - 90,
        screenY - 120,

        player.width,
        player.height
    );
}

// ======================
// HUD
// ======================

function drawHUD() {

    // 🔲 Barre d'endurance fond
    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    // 🎯 Couleur endurance
    let color = "lime";
    if (stamina < 60) color = "orange";
    if (stamina < 25) color = "red";

    // 🔋 Barre d'endurance
    ctx.fillStyle = color;
    ctx.fillRect(20, 20, stamina * 3, 25);

    // 🧱 Bordure barre
    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 300, 25);

    // ✍️ Texte HUD
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";

    ctx.fillText(
        "Distance : " + Math.floor(distance) + " m",
        20,
        80
    );

    ctx.fillText(
        "Vitesse : " + speed,
        20,
        120
    );

    ctx.fillText(
    "Camera : " + (activeCamera + 1),
    20,
    160
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
