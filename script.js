const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// IMAGES
// =====================

const stadium = new Image();
stadium.src = "stadium1.png";

const crowd = new Image();
crowd.src = "crowd.png";

const track = new Image();
track.src = "track.png";

const playerSprite = new Image();
playerSprite.src = "player.png";

// =====================
// JOUEUR
// =====================

const player = {
    x: 0,
    y: 0,
    width: 140,
    height: 180
};

const TOTAL_FRAMES = 12;

let frame = 0;
let frameTimer = 0;

// =====================
// JEU
// =====================

let speed = 0;
let stamina = 100;
let boost = false;
let distance = 0;

let cameraX = 0;

// =====================
// RESIZE
// =====================

function resize() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player.x = canvas.width * 0.35;
    player.y = canvas.height - 260;
}

window.addEventListener("resize", resize);

window.addEventListener("orientationchange", () => {
    setTimeout(resize, 300);
});

resize();

// =====================
// BOOST
// =====================

const boostBtn = document.getElementById("boostBtn");

if (boostBtn) {

    boostBtn.addEventListener("touchstart", () => {
        boost = true;
    });

    boostBtn.addEventListener("touchend", () => {
        boost = false;
    });

    boostBtn.addEventListener("mousedown", () => {
        boost = true;
    });

    boostBtn.addEventListener("mouseup", () => {
        boost = false;
    });

    boostBtn.addEventListener("mouseleave", () => {
        boost = false;
    });
}

// =====================
// UPDATE
// =====================

function update() {

    let targetSpeed = 7;

    if (boost && stamina > 0) {
        targetSpeed = 12;
        stamina -= 0.5;
    } else {
        stamina += 0.2;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    speed += (targetSpeed - speed) * 0.08;

    distance += speed * 0.1;

    cameraX += speed;

    frameTimer++;

    const animSpeed = boost ? 2 : 4;

    if (frameTimer >= animSpeed) {

        frame++;

        if (frame >= TOTAL_FRAMES) {
            frame = 0;
        }

        frameTimer = 0;
    }
}

// =====================
// STADE
// =====================

function drawStadium() {

    if (!stadium.complete) return;

    const offset = (cameraX * 0.05) % canvas.width;

    for (let i = -1; i < 3; i++) {

        ctx.drawImage(
            stadium,
            i * canvas.width - offset,
            0,
            canvas.width,
            260
        );
    }
}

// =====================
// PUBLIC
// =====================

function drawCrowd() {

    if (!crowd.complete) return;

    const offset = (cameraX * 0.15) % canvas.width;

    for (let i = -1; i < 3; i++) {

        ctx.drawImage(
            crowd,
            i * canvas.width - offset,
            120,
            canvas.width,
            150
        );
    }
}

// =====================
// PISTE
// =====================

function drawTrack() {

    if (!track.complete) return;

    const offset = cameraX % canvas.width;

    for (let i = -1; i < 4; i++) {

        ctx.drawImage(
            track,
            i * canvas.width - offset,
            canvas.height - 180,
            canvas.width,
            180
        );
    }
}

// =====================
// JOUEUR
// =====================

function drawPlayer() {

    if (!playerSprite.complete) return;

    const frameWidth = playerSprite.width / TOTAL_FRAMES;
    const frameHeight = playerSprite.height;

    // Ombre

    ctx.beginPath();

    ctx.ellipse(
        player.x + player.width / 2,
        player.y + player.height - 5,
        45,
        15,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // Sprite

    ctx.drawImage(
        playerSprite,
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

// =====================
// HUD
// =====================

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
    ctx.font = "24px Arial";

    ctx.fillText("STAMINA", 20, 15);
    ctx.fillText("Vitesse : " + speed.toFixed(1), 20, 80);
    ctx.fillText("Distance : " + Math.floor(distance) + " m", 20, 120);
}

// =====================
// DRAW
// =====================

function draw() {

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStadium();
    drawCrowd();
    drawTrack();
    drawPlayer();
    drawHUD();
}

// =====================
// LOOP
// =====================

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
