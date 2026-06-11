const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 🏃 PLAYER
let player = { x: 200, y: canvas.height - 200 };
let cameraX = 0;

// ⚡ STATS
let speed = 0;
let stamina = 100;
let boost = false;

// 🎮 JOYSTICK
let joy = { x: 0 };

// ================= BOOST =================
document.getElementById("boostBtn").addEventListener("touchstart", () => {
boost = true;
});

document.getElementById("boostBtn").addEventListener("touchend", () => {
boost = false;
});

// ================= UPDATE =================
function update() {

let targetSpeed = joy.x * 6;

// ⚡ boost system
if (boost && stamina > 0) {
targetSpeed = 10;
stamina -= 0.5;
} else {
stamina += 0.2;
}

stamina = Math.max(0, Math.min(100, stamina));

speed += (targetSpeed - speed) * 0.1;

// 🎥 caméra
cameraX += speed;

// 🏃 joueur
player.x += speed;
}

// ================= DRAW =================
function draw() {

ctx.fillStyle = "#222";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// piste
ctx.fillStyle = "#333";
ctx.fillRect(-cameraX, canvas.height - 150, canvas.width * 3, 150);

// joueur
ctx.fillStyle = "red";
ctx.fillRect(player.x - cameraX, canvas.height - 220, 40, 80);

// stamina bar
ctx.fillStyle = "green";
ctx.fillRect(20, 20, stamina * 2, 10);
}

// ================= LOOP =================
function loop() {
update();
draw();
requestAnimationFrame(loop);
}

loop();
