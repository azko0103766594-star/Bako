const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// IMAGES

const stadium = new Image();
stadium.src = "stadium1.png";

const crowd = new Image();
crowd.src = "crowd.png";

const track = new Image();
track.src = "track.png";

const playerSprite = new Image();
playerSprite.src = "player.png";

// RESIZE

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// JOUEUR

const player = {
    x: 0,
    y: 0,
    width: 180,
    height: 240
};

const COLS = 4;
const ROWS = 3;
const TOTAL_FRAMES = 12;

let frame = 0;
let frameTimer = 0;

// GAME

let speed = 7;
let stamina = 100;
let boost = false;
let distance = 0;
let worldX = 0;

// BOOST

const boostBtn = document.getElementById("boostBtn");

boostBtn.addEventListener("touchstart", () => boost = true);
boostBtn.addEventListener("touchend", () => boost = false);

boostBtn.addEventListener("mousedown", () => boost = true);
boostBtn.addEventListener("mouseup", () => boost = false);

// UPDATE

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

    if (distance >= 100) {
        distance = 100;
        speed = 0;
        boost = false;
    }

    player.x = canvas.width * 0.45;
    player.y = canvas.height - 420;

    frameTimer++;

    if (frameTimer >= 4) {

        frame++;

        if (frame >= TOTAL_FRAMES) {
            frame = 0;
        }

        frameTimer = 0;
    }
}

// BACKGROUND

function drawBackground() {

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (stadium.complete) {

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

    if (crowd.complete) {

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

    if (track.complete) {

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
    }
}

// LIGNES

function drawFinishLines() {

    const lines = [
        { x: 150, label: "START" },
        { x: 1000, label: "100m" }
    ];

    lines.forEach(line => {

        const screenX = line.x - worldX + player.x;

        ctx.fillStyle = "white";

        ctx.fillRect(
            screenX,
            canvas.height - 180,
            10,
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

// JOUEUR

function drawPlayer() {

    if (!playerSprite.complete) return;

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

// HUD

function drawHUD() {

    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    ctx.fillStyle = "lime";
    ctx.fillRect(20, 20, stamina * 3, 25);

    ctx.fillStyle = "white";
    ctx.font = "22px Arial";

    ctx.fillText(
        "Distance : " + Math.floor(distance) + " m",
        20,
        80
    );

    if (distance >= 100) {

        ctx.fillStyle = "gold";
        ctx.font = "50px Arial";

        ctx.fillText(
            "FINISH !",
            canvas.width / 2 - 100,
            canvas.height / 2
        );
    }
}

// DRAW

function draw() {

    drawBackground();
    drawFinishLines();
    drawPlayer();
    drawHUD();
}

// LOOP

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
