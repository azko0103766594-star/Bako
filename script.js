const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ================= CANVAS =================

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();

window.addEventListener("resize", resize);

// ================= IMAGES =================

const assets = {};

function load(name, src) {
    const img = new Image();
    img.src = src;
    assets[name] = img;
}

load("stadium", "stadium1.png");
load("player", "player.png");

// ================= JOUEUR =================

const player = {
    x: 180,
    targetX: 180,
    width: 180,
    height: 220
};

const TOTAL_FRAMES = 9;
let frame = 0;
let frameTimer = 0;

// ================= JEU =================

let boost = false;
let stamina = 100;
let speed = 6;
let distance = 0;

// ================= BOOST =================

const boostBtn = document.getElementById("boostBtn");

boostBtn.addEventListener("touchstart", () => boost = true);
boostBtn.addEventListener("touchend", () => boost = false);
boostBtn.addEventListener("touchcancel", () => boost = false);

boostBtn.addEventListener("mousedown", () => boost = true);
boostBtn.addEventListener("mouseup", () => boost = false);
boostBtn.addEventListener("mouseleave", () => boost = false);

// ================= UPDATE =================

function update() {

    if (boost && stamina > 0) {

        speed = 12;

        stamina -= 0.4;

        player.targetX = 280;

    } else {

        speed = 6;

        stamina += 0.2;

        player.targetX = 180;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    distance += speed * 0.05;

    player.x += (player.targetX - player.x) * 0.08;

    // Animation plus rapide en boost

    frameTimer++;

    const frameDelay = boost ? 4 : 7;

    if (frameTimer >= frameDelay) {

        frame++;
        frameTimer = 0;

        if (frame >= TOTAL_FRAMES) {
            frame = 0;
        }
    }
}

// ================= FOND =================

function drawBackground() {

    if (!assets.stadium.complete) return;

    ctx.drawImage(
        assets.stadium,
        0,
        0,
        canvas.width,
        canvas.height
    );
}

// ================= JOUEUR =================

function drawPlayer() {

    if (!assets.player.complete) return;

    const frameWidth = assets.player.width / TOTAL_FRAMES;
    const frameHeight = assets.player.height;

    // Ombre

    ctx.beginPath();
    ctx.ellipse(
        player.x + 90,
        canvas.height - 55,
        50,
        12,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();

    // Sprite

    ctx.drawImage(
        assets.player,
        frame * frameWidth,
        0,
        frameWidth,
        frameHeight,

        player.x,
        canvas.height - 280,

        player.width,
        player.height
    );
}

// ================= HUD =================

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
    ctx.fillText("Vitesse : " + speed.toFixed(0), 20, 80);
    ctx.fillText("Distance : " + Math.floor(distance) + " m", 20, 110);
}

// ================= DRAW =================

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawPlayer();
    drawHUD();
}

// ================= LOOP =================

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
