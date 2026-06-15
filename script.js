window.onerror = function (msg) {
    console.log("ERROR:", msg);
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
stadium.src = "stadium1.png";

const playerSprite = new Image();
playerSprite.src = "player.png";

// ======================
// JOUEUR
// ======================
const player = {
    width: 80,
    height: 120,
    worldX: 260,
    worldY: 700
};
const path = [
    {x:350,y:620},
    {x:500,y:700},
    {x:800,y:720},
    {x:1100,y:700},

    {x:1220,y:600},
    {x:1260,y:520},
    {x:1220,y:430},

    {x:1100,y:350},
    {x:800,y:320},
    {x:500,y:350},

    {x:350,y:430},
    {x:300,y:520}
];
let currentPoint = 0;

function updateTrack() {

    const target = path[currentPoint];

    const dx = target.x - player.worldX;
    const dy = target.y - player.worldY;

    const dist = Math.hypot(dx, dy);

    // direction normalisée
    const dirX = dx / dist;
    const dirY = dy / dist;

    // empêche retournement brutal
    const dot = dirX * lastDx + dirY * lastDy;

    if (dist < 80 || dot < -0.3) {
        currentPoint = (currentPoint + 1) % path.length;
        return;
    }

    player.worldX += dirX * speed * 0.9;
    player.worldY += dirY * speed * 0.9;

    lastDx = dirX;
    lastDy = dirY;
}
// ======================
// SPRITE ANIMATION
// ======================
const TOTAL_FRAMES = 12;
const COLS = 4;

let frame = 0;
let frameTimer = 0;

// ======================
// GAME
// ======================
let boost = false;
let speed = 5;
let stamina = 100;
let distance = 0;

// ======================
// STADE / PISTE OVALE
// ======================
const track = {
    cx: 768,
    cy: 512,
    rx: 600,
    ry: 260
};

let trackProgress = 0;

// ======================
// CAMERA TV
// ======================
let cameraX = track.cx;
let cameraY = track.cy;
// ======================
// BOOST BUTTON
// ======================
const boostBtn = document.getElementById("boostBtn");

if (boostBtn) {
    boostBtn.addEventListener("touchstart", () => boost = true);
    boostBtn.addEventListener("touchend", () => boost = false);
    boostBtn.addEventListener("mousedown", () => boost = true);
    boostBtn.addEventListener("mouseup", () => boost = false);
    boostBtn.addEventListener("mouseleave", () => boost = false);
}

// ======================
// UPDATE GAME
// ======================
function update() {

    // vitesse + stamina
    if (boost && stamina > 0) {
        speed = 10;
        stamina -= 0.6;
    } else {
        speed = 5;
        stamina += 0.25;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    // progression piste
    trackProgress += speed * 0.003;
    distance += speed * 0.1;

    // boucle piste
    if (trackProgress > Math.PI * 2) {
        trackProgress -= Math.PI * 2;
    }

    // position joueur (ellipse)
    updateTrack();
    cameraX += (player.worldX - cameraX) * 0.05;
cameraY += (player.worldY - cameraY) * 0.05;

// limite la caméra dans l'image
cameraX = Math.max(500, Math.min(cameraX, 1030));
cameraY = Math.max(350, Math.min(cameraY, 680));
    // animation sprite
    frameTimer++;

    const animSpeed = boost ? 3 : 6;

    if (frameTimer >= animSpeed) {
        frame = (frame + 1) % TOTAL_FRAMES;
        frameTimer = 0;
    }
}

// ======================
// DRAW STADIUM
// ======================
function drawStadium() {

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!stadium.complete) return;

    const zoom = 0.8;

    const drawX = canvas.width / 2 - cameraX * zoom;
    const drawY = canvas.height / 2 - cameraY * zoom;

    ctx.drawImage(
        stadium,
        drawX,
        drawY,
        1536 * zoom,
        1024 * zoom
    );
}

// ======================
// DRAW PLAYER
// ======================
function drawPlayer() {

    const zoom = 1.2;

    const x = canvas.width / 2 + (player.worldX - cameraX) * zoom;
    const y = canvas.height / 2 + (player.worldY - cameraY) * zoom;

    // ombre
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + 55, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!playerSprite.complete) return;

    const fw = playerSprite.width / COLS;
    const fh = playerSprite.height / 3;

    const col = frame % COLS;
    const row = Math.floor(frame / COLS);

    ctx.drawImage(
    playerSprite,
    col * fw,
    row * fh,
    fw,
    fh,
    x - player.width / 2,
    y - player.height / 2 + 8,
    player.width,
    player.height
);
}
// ======================
// HUD
// ======================
function drawHUD() {

    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    ctx.fillStyle =
        stamina < 25 ? "red" :
        stamina < 60 ? "orange" : "lime";

    ctx.fillRect(20, 20, stamina * 3, 25);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 300, 25);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText("Distance: " + Math.floor(distance), 20, 80);
    ctx.fillText("Vitesse: " + speed, 20, 110);
    ctx.fillText("Camera TV", 20, 140);
}
// ======================
// LOOP
// ======================
function loop() {
    update();
    drawStadium();
    drawPlayer();
    drawHUD();

    requestAnimationFrame(loop);
}

loop();
