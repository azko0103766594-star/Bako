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
resize();

// ======================
// IMAGES
// ======================

const playerIdle = new Image();
playerIdle.src = "player_idle.png";
const playerRun = new Image();
playerRun.src = "player_run.png";

const playerDribble = new Image();
playerDribble.src = "player_dribble.png";

const playerPass = new Image();
playerPass.src = "player_pass.png";

const playerShoot = new Image();
playerShoot.src = "player_shoot.png";

const playerCelebration = new Image();
playerCelebration.src = "player_celebration.png";

let currentSprite = playerIdle;

// ======================
// MONDE
// ======================

const world = {
    width: 3000,
    height: 2000
};

// ======================
// JOUEUR
// ======================

const player = {
    x: 1500,
    y: 1000,
    width: 80,
    height: 120,
    speed: 4
};

// ======================
// BALLON
// ======================

const ball = {
    x: 1600,
    y: 1000,
    size: 35
};

// ======================
// CAMERA
// ======================

let cameraX = player.x;
let cameraY = player.y;

// ======================
// JOYSTICK
// ======================

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joyX = 0;
let joyY = 0;

joystick.addEventListener("touchmove", (e) => {

    const rect = joystick.getBoundingClientRect();

    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    let dx = x - 70;
    let dy = y - 70;

    const dist = Math.hypot(dx, dy);

    if (dist > 50) {
        dx = dx / dist * 50;
        dy = dy / dist * 50;
    }

    joyX = dx / 50;
    joyY = dy / 50;

    stick.style.left = (45 + dx) + "px";
    stick.style.top = (45 + dy) + "px";

});

joystick.addEventListener("touchend", () => {

    joyX = 0;
    joyY = 0;

    stick.style.left = "45px";
    stick.style.top = "45px";

});

// ======================
// SPRINT
// ======================

let sprint = false;

const sprintBtn = document.getElementById("sprintBtn");

sprintBtn.addEventListener("touchstart", () => {
    sprint = true;
});

sprintBtn.addEventListener("touchend", () => {
    sprint = false;
});

// ======================
// PASSE
// ======================

document.getElementById("passBtn").addEventListener("click", () => {

    ball.x += joyX * 150;
    ball.y += joyY * 150;

});

// ======================
// TIR
// ======================

document.getElementById("shootBtn").addEventListener("click", () => {

    ball.x += joyX * 300;
    ball.y += joyY * 300;

});

// ======================
// ANIMATION
// ======================

const COLS = 8;
const TOTAL_FRAMES = 8;

let frame = 0;
let frameTimer = 0;

let animation = 0;

// 0 = IDLE
// 1 = RUN
// 2 = DRIBBLE
// 3 = PASS
// 4 = SHOOT
// 5 = CELEBRATION
// ======================
// UPDATE
// ======================

function update() {

    const speed = sprint ? 8 : 4;

    player.x += joyX * speed;
    player.y += joyY * speed;

    player.x = Math.max(0, Math.min(world.width, player.x));
    player.y = Math.max(0, Math.min(world.height, player.y));

    cameraX += (player.x - cameraX) * 0.08;
    cameraY += (player.y - cameraY) * 0.08;

    frameTimer++;

    if (frameTimer > 5) {

        frame++;
        frame %= TOTAL_FRAMES;

        frameTimer = 0;
    }
}

// ======================
// TERRAIN
// ======================

function drawField() {

    const drawX = canvas.width / 2 - cameraX;
    const drawY = canvas.height / 2 - cameraY;

    if (field.complete) {

        ctx.drawImage(
            field,
            drawX,
            drawY,
            world.width,
            world.height
        );

    } else {

        ctx.fillStyle = "#2e8b57";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

    }
}

// ======================
// BALLON
// ======================

function drawBall() {

    const x =
        canvas.width / 2 +
        (ball.x - cameraX);

    const y =
        canvas.height / 2 +
        (ball.y - cameraY);

    if (ballImg.complete) {

        ctx.drawImage(
            ballImg,
            x - ball.size / 2,
            y - ball.size / 2,
            ball.size,
            ball.size
        );

    } else {

        ctx.fillStyle = "white";

        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

    }
}

// ======================
// JOUEUR
// ======================

function drawPlayer() {

    const x =
        canvas.width / 2;

    const y =
        canvas.height / 2;

    if (!playerSprite.complete) {

        ctx.fillStyle = "red";

        ctx.fillRect(
            x - 40,
            y - 60,
            80,
            120
        );

        return;
    }

    const fw = playerSprite.width / 8;
const fh = playerSprite.height / 6;

const col = frame;
const row = animation;
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
// LOOP
// ======================

function loop() {

    update();

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawField();
    drawBall();
    drawPlayer();

    requestAnimationFrame(loop);
}

loop();
