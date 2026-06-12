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
// COURSE
// ======================

const FINISH_DISTANCE = 100;

let boost = false;
let stamina = 100;
let speed = 7;
let distance = 0;
let worldX = 0;
let raceFinished = false;

let startTime = Date.now();
let raceTime = 0;

// ======================
// BOUTON BOOST
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

    if (raceFinished) return;

    if (boost && stamina > 0) {
        speed = 12;
        stamina -= 0.5;
    } else {
        speed = 7;
        stamina += 0.2;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    worldX += speed;

    distance += speed * 0.10;

    raceTime = (Date.now() - startTime) / 1000;

    if (distance >= FINISH_DISTANCE) {
        distance = FINISH_DISTANCE;
        raceFinished = true;
        speed = 0;
    }

    player.x = canvas.width * 0.42;
    player.y = canvas.height - 420;

    frameTimer++;

    if (frameTimer >= (boost ? 2 : 4)) {

        frame++;
        if (frame >= TOTAL_FRAMES) frame = 0;

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
// DEPART + ARRIVEE
// ======================

function drawRaceMarks() {

    const meterSize = 25;

    const startX =
        player.x - (distance * meterSize);

    const finishX =
        startX + (FINISH_DISTANCE * meterSize);

    // Ligne départ

    ctx.fillStyle = "white";

    ctx.fillRect(
        startX,
        canvas.height - 180,
        8,
        180
    );

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText(
        "DEPART",
        startX - 35,
        canvas.height - 200
    );

    // Ligne arrivée

    for (let y = 0; y < 180; y += 20) {

        ctx.fillStyle =
            y % 40 === 0 ? "black" : "white";

        ctx.fillRect(
            finishX,
            canvas.height - 180 + y,
            20,
            20
        );
    }

    ctx.fillStyle = "yellow";

    ctx.fillText(
        "100 m",
        finishX - 10,
        canvas.height - 200
    );
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

    if (!playerSprite.complete ||
        playerSprite.naturalWidth === 0) {

        ctx.fillStyle = "red";

        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
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
    ctx.fillRect(
        20,
        20,
        stamina * 3,
        25
    );

    ctx.strokeStyle = "white";
    ctx.strokeRect(
        20,
        20,
        300,
        25
    );

    ctx.fillStyle = "white";
    ctx.font = "22px Arial";

    ctx.fillText(
        "Distance : " +
        Math.floor(distance) +
        " / 100 m",
        20,
        80
    );

    ctx.fillText(
        "Temps : " +
        raceTime.toFixed(1) +
        " s",
        20,
        120
    );

    ctx.fillText(
        "Vitesse : " + speed,
        20,
        160
    );

    if (raceFinished) {

        ctx.fillStyle = "yellow";
        ctx.font = "60px Arial";

        ctx.fillText(
            "VICTOIRE !",
            canvas.width / 2 - 150,
            180
        );

        ctx.font = "35px Arial";

        ctx.fillText(
            raceTime.toFixed(2) + " s",
            canvas.width / 2 - 60,
            240
        );
    }
}

// ======================
// DRAW
// ======================

function draw() {

    drawBackground();
    drawRaceMarks();
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
