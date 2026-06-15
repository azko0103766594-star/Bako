const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// ======================
// IMAGES
// ======================

// TERRAIN
const field = new Image();
field.src = "terrain.png";

// JOUEUR
const playerSprite = new Image();
playerSprite.src = "player.png";

// BALLON
const ballImg = new Image();
ballImg.src = "ball.png";

// ======================
// JOUEUR
// ======================

const player = {
    x: 800,
    y: 450,
    width: 90,
    height: 120,
    speed: 4
};

// ======================
// BALLON
// ======================

const ball = {
    x: 900,
    y: 450,
    size: 30
};

// ======================
// ANIMATION
// ======================

const TOTAL_FRAMES = 16;
const COLS = 4;

let frame = 0;
let frameTimer = 0;

// ======================
// CONTROLES
// ======================

let up = false;
let down = false;
let left = false;
let right = false;

document.addEventListener("keydown",(e)=>{

    if(e.key==="ArrowUp") up=true;
    if(e.key==="ArrowDown") down=true;
    if(e.key==="ArrowLeft") left=true;
    if(e.key==="ArrowRight") right=true;

});

document.addEventListener("keyup",(e)=>{

    if(e.key==="ArrowUp") up=false;
    if(e.key==="ArrowDown") down=false;
    if(e.key==="ArrowLeft") left=false;
    if(e.key==="ArrowRight") right=false;

});

// ======================
// BOUTONS
// ======================

document.getElementById("shootBtn").onclick=()=>{
    console.log("TIR");
};

document.getElementById("passBtn").onclick=()=>{
    console.log("PASSE");
};

document.getElementById("sprintBtn").onclick=()=>{
    console.log("SPRINT");
};

document.getElementById("changeBtn").onclick=()=>{
    console.log("CHANGER");
};

// ======================
// UPDATE
// ======================

function update(){

    if(up) player.y -= player.speed;
    if(down) player.y += player.speed;
    if(left) player.x -= player.speed;
    if(right) player.x += player.speed;

    frameTimer++;

    if(frameTimer > 5){

        frame++;
        frame %= TOTAL_FRAMES;

        frameTimer = 0;
    }
}

// ======================
// TERRAIN
// ======================

function drawField(){

    if(field.complete){

        ctx.drawImage(
            field,
            0,
            0,
            canvas.width,
            canvas.height
        );

    }else{

        ctx.fillStyle="#2f7d32";
        ctx.fillRect(0,0,canvas.width,canvas.height);

    }
}

// ======================
// BALLON
// ======================

function drawBall(){

    if(ballImg.complete){

        ctx.drawImage(
            ballImg,
            ball.x,
            ball.y,
            ball.size,
            ball.size
        );

    }else{

        ctx.fillStyle="white";
        ctx.beginPath();
        ctx.arc(ball.x,ball.y,15,0,Math.PI*2);
        ctx.fill();

    }
}

// ======================
// JOUEUR
// ======================

function drawPlayer(){

    if(!playerSprite.complete){

        ctx.fillStyle="red";
        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        return;
    }

    const fw = playerSprite.width / COLS;
    const fh = playerSprite.height / 4;

    const col = frame % COLS;
    const row = Math.floor(frame / COLS);

    ctx.drawImage(
        playerSprite,
        col * fw,
        row * fh,
        fw,
        fh,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

// ======================
// LOOP
// ======================

function loop(){

    update();

    drawField();
    drawBall();
    drawPlayer();

    requestAnimationFrame(loop);
}

loop();