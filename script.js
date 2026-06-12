const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

let distance = 0;
let speed = 7;
let stamina = 100;
let boost = false;
let worldX = 0;

const player = {
    x: 0,
    y: 0,
    width: 80,
    height: 120
};

const boostBtn = document.getElementById("boostBtn");

if (boostBtn) {
    boostBtn.addEventListener("touchstart", () => boost = true);
    boostBtn.addEventListener("touchend", () => boost = false);

    boostBtn.addEventListener("mousedown", () => boost = true);
    boostBtn.addEventListener("mouseup", () => boost = false);
    boostBtn.addEventListener("mouseleave", () => boost = false);
}

function update() {

    let targetSpeed = 7;

    if (boost && stamina > 0) {
        targetSpeed = 12;
        stamina -= 0.5;
    } else {
        stamina += 0.2;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    speed += (targetSpeed - speed) * 0.05;

    worldX += speed;
    distance += speed * 0.1;

    player.x = canvas.width * 0.35;
    player.y = canvas.height - 220;
}

function drawTrack() {

    ctx.fillStyle = "#c0392b";
    ctx.fillRect(0, canvas.height - 220, canvas.width, 220);

    ctx.strokeStyle = "white";

    for (let y = canvas.height - 220; y < canvas.height; y += 40) {

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

    }
}

function drawPlayer() {

    ctx.fillStyle = "blue";

    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );

    ctx.beginPath();

    ctx.ellipse(
        player.x + 40,
        player.y + 125,
        35,
        12,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();
}

function drawHUD() {

    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    ctx.fillStyle = "lime";
    ctx.fillRect(20, 20, stamina * 3, 25);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 300, 25);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";

    ctx.fillText("Distance : " + Math.floor(distance) + " m", 20, 90);
    ctx.fillText("Vitesse : " + speed.toFixed(1), 20, 130);
}

function draw() {

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTrack();
    drawPlayer();
    drawHUD();
}

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
