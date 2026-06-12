const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);

resize();

let stamina = 100;
let boost = false;
let distance = 0;
let speed = 7;

const player = {
    x: 0,
    y: 0,
    w: 100,
    h: 140
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

    if (boost && stamina > 0) {
        speed = 12;
        stamina -= 0.5;
    } else {
        speed = 7;
        stamina += 0.2;
    }

    stamina = Math.max(0, Math.min(100, stamina));

    distance += speed * 0.1;

    player.x = canvas.width * 0.35;
    player.y = canvas.height - 220;
}

function draw() {

    // ciel
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // sol
    ctx.fillStyle = "#666";
    ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

    // joueur
    ctx.fillStyle = "red";
    ctx.fillRect(
        player.x,
        player.y,
        player.w,
        player.h
    );

    // stamina
    ctx.fillStyle = "#222";
    ctx.fillRect(20, 20, 300, 25);

    ctx.fillStyle = stamina > 25 ? "lime" : "red";
    ctx.fillRect(20, 20, stamina * 3, 25);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 300, 25);

    // texte
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";

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

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}

loop();
