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
    player.worldX = track.cx + Math.cos(trackProgress) * track.rx;
    player.worldY = track.cy + Math.sin(trackProgress) * track.ry;

    cameraX += (player.worldX - cameraX) * 0.08;
cameraY += (player.worldY - cameraY) * 0.08;
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

    const zoom = 1.2;

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
