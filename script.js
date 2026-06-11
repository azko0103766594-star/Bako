const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 🎥 CAMERA
let cameraX = 0;

// 🏃 PLAYER
let player = {
  x: 200,
  y: canvas.height - 220
};

// ⚡ GAME STATE
let speed = 0;
let stamina = 100;
let boost = false;

// 🎮 JOYSTICK (simple gauche/droite)
let joy = { x: 1 }; // avance automatique

// ================= IMAGES =================
const assets = {};

function load(name, src){
  const img = new Image();
  img.src = src;
  assets[name] = img;
}

// 🏟️ DECOR (TES IMAGES ICI)
load("stadium", "./stadium.png");
load("track", "./track.png");
load("crowd", "./crowd.png");
load("player", "./player.png");

// ================= BOOST =================
document.getElementById("boostBtn").addEventListener("touchstart", () => {
boost = true;
});

document.getElementById("boostBtn").addEventListener("touchend", () => {
boost = false;
});

// ================= UPDATE =================
function update(){

// ⚡ vitesse de base (course automatique)
let targetSpeed = joy.x * 6;

// ⚡ boost
if(boost && stamina > 0){
targetSpeed = 10;
stamina -= 0.6;
}else{
stamina += 0.3;
}

stamina = Math.max(0, Math.min(100, stamina));

// 🏃 accélération fluide
speed += (targetSpeed - speed) * 0.1;

// 🎥 caméra suit le joueur
cameraX += speed;

// 🏃 déplacement joueur
player.x += speed;
}

// ================= DRAW =================
function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

// 🌌 BACKGROUND
ctx.fillStyle = "#111";
ctx.fillRect(0,0,canvas.width,canvas.height);

// 🏟️ STADIUM
if(assets.stadium?.complete){
ctx.drawImage(
assets.stadium,
-cameraX * 0.3,
0,
canvas.width * 2,
300
);
}

// 👥 CROWD
if(assets.crowd?.complete){
ctx.drawImage(
assets.crowd,
-cameraX * 0.4,
80,
canvas.width * 2,
200
);
}

// 🟫 TRACK
if(assets.track?.complete){
ctx.drawImage(
assets.track,
-cameraX,
canvas.height - 150,
canvas.width * 3,
150
);
}

// 🏃 PLAYER
if(assets.player?.complete){
ctx.drawImage(
assets.player,
player.x - cameraX,
canvas.height - 220,
60,
100
);
}else{
ctx.fillStyle = "red";
ctx.fillRect(player.x - cameraX, canvas.height - 220, 40, 80);
}

// ⚡ STAMINA BAR
ctx.fillStyle = "green";
ctx.fillRect(20,20,stamina * 2,10);
}

// ================= LOOP =================
function loop(){
update();
draw();
requestAnimationFrame(loop);
}

loop();
