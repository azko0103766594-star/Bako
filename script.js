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
    worldX: 0,
    worldY: 0
};

// ======================
// SPRITE
// ======================
const TOTAL_FRAMES = 12;
const COLS = 4;

let frame = 0;
let frameTimer = 0;

// ======================
// GAME
// ======================
let boost = false;
let stamina = 100;
let speed = 5;
let distance = 0;
let trackProgress = 0;

// ======================
// STADE
// ======================
const stadiumWidth = 1536;
const stadiumHeight = 1024;

const track = {
    cx: 768,
    cy: 512,
    rx: 600,
    ry: 260
};

// ======================
// CAMERA
// ======================
const cameras = [
    { x: track.cx + track.rx, y: track.cy },
    { x: track.cx, y: track.cy + track.ry },
    { x: track.cx - track.rx, y: track.cy },
    { x: track.cx, y: track.cy - track.ry }
];

let activeCamera = 0;
let cameraX = cameras[0].x;
let cameraY = cameras[0].y;

// ======================
// BOOST BUTTON SAFE
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

    // POSITION
    player.worldX = track.cx + Math.cos(trackProgress) * track.rx;
    player.worldY = track.cy + Math.sin(trackProgress) * track.ry;

    // CAMERA ANGLE
    let angle = Math.atan2(
        player.worldY - track.cy,
        player.worldX - track.cx
    );

    if (angle < 0) angle += Math.PI * 2;

    if (angle < Math.PI / 2) activeCamera = 0;
    else if (angle < Math.PI) activeCamera = 1;
    else if (angle < (3 * Math.PI) / 2) activeCamera = 2;
    else activeCamera = 3;

    const targetX =
        cameras[activeCamera].x +
        (player.worldX - cameras[activeCamera].x) * 0.25;

    const targetY =
        cameras[activeCamera].y +
        (player.worldY - cameras[activeCamera].y) * 0.25;

    cameraX += (targetX - cameraX) * 0.05;
    cameraY += (targetY - cameraY) * 0.05;

    // ANIMATION
    frameTimer++;

    if (frameTimer >= (boost ? 2 : 4)) {
        frame = (frame + 1) % TOTAL_FRAMES;
        frameTimer = 0;
    }
}

// ======================
// DRAW STADIUM SAFE
// ======================
function drawStadium() {

    // toujours fond (VISIBLE)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // image pas prête → stop ici MAIS fond reste visible
    if (!stadium.complete || stadium.naturalWidth === 0) return;

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
// PLAYER
// ======================
function drawPlayer() {

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    // OMBRE
ctx.fillStyle = "rgba(0,0,0,0.25)";
ctx.beginPath();
ctx.ellipse(
    x,
    y + 95,
    20, // largeur réduite
    6,  // hauteur réduite
    0,
    0,
    Math.PI * 2
);
ctx.fill();
    ctx.fill();

    // Vérifie que l'image est chargée
    if (!playerSprite.complete || playerSprite.naturalWidth === 0) {
        return;
    }

    // Sprite sheet
    const fw = playerSprite.width / COLS;
    const fh = playerSprite.height / 3;

    const col = frame % COLS;
    const row = Math.floor(frame / COLS);

    // Joueur
    ctx.drawImage(
        playerSprite,
        col * fw,
        row * fh,
        fw,
        fh,
        x - player.width / 2,
        y - player.height / 2,
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
    ctx.fillText("Camera: " + (activeCamera + 1), 20, 140);
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
