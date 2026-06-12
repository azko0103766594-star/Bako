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

const crowd = new Image();
crowd.src = "crowd.png";

const track = new Image();
track.src = "track.png";

const playerSprite = new Image();
playerSprite.src = "player.png";

// ======================
// JOUEUR
// ======================

const player = {
    x: 0,
    y: 0,
    width: 180,
    height: 240
};

const TOTAL_FRAMES = 12;
const COLS = 4;
const ROWS = 3;

let frame = 0;
let frameTimer = 0;

// ======================
// GAME
// ======================

let boost = false;
let stamina = 100;
let speed = 7;
let distance = 0;
let worldX = 0;

// ======================
// BOOST
// ======================

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

// ======================
// UPDATE
// ======================

function update() {

    if (boost && stamina > 0) {
        speed = 12;
        stamina -= 0.5;
    } else {
        speed = 7;
        stamina += 0.2;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    worldX += speed;
    distance += speed * 0.1;

    player.x = canvas.width * 0.45;
    player.y = canvas.height - 420;

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
// BACKGROUND
// ======================

function drawBackground() {

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (stadium.complete && stadium.naturalWidth > 0) {

        const offset = (worldX * 0.05) % canvas.width;

        for (let i = -1; i < 3; i++) {

            ctx.drawImage(
                stadium,
                i * canvas.width - offset,
                0,
                canvas.width,
                250
            );
        }
    }

    if (crowd.complete && crowd.naturalWidth > 0) {

        const offset = (worldX * 0.15) % canvas.width;

        for (let i = -1; i < 3; i++) {

            ctx.drawImage(
                crowd,
                i * canvas.width - offset,
                120,
                canvas.width,
                130
            );
        }
    }

    if (track.complete && track.naturalWidth > 0) {

        const offset = worldX % canvas.width;

        for (let i = -1; i < 4; i++) {

            ctx.drawImage(
                track,
                i * canvas.width - offset,
                canvas.height - 180,
                canvas.width,
                180
            );
        }

    } else {

        ctx.fillStyle = "#666";

        ctx.fillRect(
            0,
            canvas.height - 180,
            canvas.width,
            180
        );
    }
}

// ======================
// JOUEUR
// ======================

function drawPlayer() {

    ctx.beginPath();

    ctx.ellipse(
        player.x + player.width / 2,
        player.y + player.height,
        45,
        15,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();

    if (!playerSprite.complete || playerSprite.naturalWidth === 0) {

        ctx.fillStyle = "red";
        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        return;
    }

    const frameWidth = playerSprite.width / COLS;
    const frameHeight = playerSprite.height / ROWS;

    const col = frame % COLS;
    const row = Math.floor(frame / COLS);

    ctx.drawImage(
        playerSprite,
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
        player.x,
        player.y,
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

    let color = "lime";

    if (stamina < 60) color = "orange";
    if (stamina < 25) color = "red";

    ctx.fillStyle = color;
    ctx.fillRect(20, 20, stamina * 3, 25);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 300, 25);

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
}
function drawFinishLines() {

    const startX = 150;

    const finish100 = 1000;
    const finish200 = 2000;
    const finish400 = 4000;

    const lines = [
        { x: startX, label: "START" },
        { x: finish100, label: "100m" },
        { x: finish200, label: "200m" },
        { x: finish400, label: "400m" }
    ];

    lines.forEach(line => {

        const screenX = line.x - worldX + player.x;

        if (screenX < -100 || screenX > canvas.width + 100) return;

        ctx.fillStyle = "white";

        ctx.fillRect(
            screenX,
            canvas.height - 180,
            12,
            180
        );

        ctx.fillStyle = "yellow";
        ctx.font = "24px Arial";

        ctx.fillText(
            line.label,
            screenX - 20,
            canvas.height - 200
        );
    });
}
if (distance >= 100) {

    ctx.fillStyle = "gold";
    ctx.font = "50px Arial";

    ctx.fillText(
        "FINISH !",
        canvas.width / 2 - 100,
        canvas.height / 2
    );
}
// ======================
// DRAW
// ======================

function draw() {

function draw() {

    drawBackground();

    drawFinishLines();

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
