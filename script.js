const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// RESIZE

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// IMAGES

const playerSprite = new Image();
playerSprite.src = "player.png";

// JOUEUR

const player = {
    x: 300,
    y: 200,
    width: 180,
    height: 240
};

const COLS = 4;
const ROWS = 3;
const TOTAL_FRAMES = 12;

let frame = 0;
let frameTimer = 0;

// BOOST

let boost = false;

const boostBtn = document.getElementById("boostBtn");

boostBtn.addEventListener("touchstart", () => boost = true);
boostBtn.addEventListener("touchend", () => boost = false);

boostBtn.addEventListener("mousedown", () => boost = true);
boostBtn.addEventListener("mouseup", () => boost = false);

// UPDATE

function update() {

    player.x = canvas.width * 0.4;
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

// DRAW PLAYER

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

// DRAW

function draw() {

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#666";
    ctx.fillRect(
        0,
        canvas.height - 180,
        canvas.width,
        180
    );

    drawPlayer();
}

// LOOP

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
