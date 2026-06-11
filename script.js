const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 🏃 PLAYER + CAMERA
let player = { x: 200, y: canvas.height - 200 };
let cameraX = 0;

// ⚡ GAME STATE
let speed = 0;
let stamina = 100;
let boost = false;

// 🎮 JOYSTICK (simple gauche/droite)
let joy = { x: 0 };

// ================= IMAGES =================
const assets = {};

function load(name, src){
  const img = new Image();
  img.src = src;
  assets[name] = img;
}

// 👉 TES IMAGES ICI
load("stadium", "assets/stadium.png");
load("track", "assets/track.png");
load("crowd", "assets/crowd.png");
load("player", "assets/player.png");

// ================= INPUT BOOST =================
document.getElementById("boostBtn").addEventListener("touchstart", () => {
boost = true;
});

document.getElementById("boostBtn").addEventListener("touchend", () => {
boost = false;
});

// ================= UPDATE =================
function update(){

let targetSpeed = joy.x * 6;

// ⚡ boost system
if(boost && stamina > 0){
targetSpeed = 10;
stamina -= 0.5;
}else{
stamina += 0.2;
}

stamina = Math.max(0, Math.min(100, stamina));

// accélération fluide
speed += (targetSpeed - speed) * 0.1;

// 🎥 caméra suit joueur
cameraX += speed;

// 🏃 joueur avance
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
ctx.drawImage(assets.stadium, -cameraX*0.3, 0, canvas.width*2, 300);
}

// 👥 CROWD
if(assets.crowd?.complete){
ctx.drawImage(assets.crowd, -cameraX*0.4, 100, canvas.width*2, 200);
}

// 🟫 TRACK
if(assets.track?.complete){
ctx.drawImage(assets.track, -cameraX, canvas.height-150, canvas.width*3, 150);
}

// 🏃 PLAYER
if(assets.player?.complete){
ctx.drawImage(assets.player, player.x-cameraX, canvas.height-220, 60, 100);
}

// ⚡ STAMINA BAR
ctx.fillStyle = "green";
ctx.fillRect(20,20,stamina*2,10);
}

// ================= LOOP =================
function loop(){
update();
draw();
requestAnimationFrame(loop);
}

loop();
