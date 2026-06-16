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
// IMAGE PLATEAU
// ======================

const board = new Image();
board.src = "plateau.png";

// ======================
// JOUEURS
// ======================

const players = [
    { coins: 100, turns: 15, skip: false },
    { coins: 100, turns: 15, skip: false },
    { coins: 100, turns: 15, skip: false },
    { coins: 100, turns: 15, skip: false }
];

let currentPlayer = 0;

// ======================
// ROUE
// ======================

let angle = 0;
let spinning = false;

const rewards = [
    "treasure",
    "bomb",
    "turbo",
    "gift",
    "jackpot",
    "thief",
    "web"
];

// ======================
// CLICK
// ======================

canvas.addEventListener("click", () => {

    if(spinning) return;

    spinWheel();

});

// ======================
// TOURNER ROUE
// ======================

function spinWheel(){

    spinning = true;

    let spins = 5 + Math.random() * 5;
    let finalAngle = angle + spins * Math.PI * 2;

    let duration = 2500;
    let start = performance.now();

    function animate(now){

        let progress = (now - start) / duration;

        if(progress > 1) progress = 1;

        let ease = 1 - Math.pow(1 - progress, 3);

        angle = finalAngle * ease;

        if(progress < 1){

            requestAnimationFrame(animate);

        }else{

            spinning = false;

            calculateResult();

        }

    }

    requestAnimationFrame(animate);

}

// ======================
// RESULTAT
// ======================

function calculateResult(){

    const segment = (Math.PI * 2) / rewards.length;

    let normalized = angle % (Math.PI * 2);

    let index = Math.floor(normalized / segment);

    let reward = rewards[index];

    applyReward(reward);

}

// ======================
// RECOMPENSE
// ======================

function applyReward(type){

    let p = players[currentPlayer];

    switch(type){

        case "treasure":
            p.coins += 5;
            break;

        case "bomb":
            p.coins -= 5;
            break;

        case "turbo":
            p.coins += 2;
            break;

        case "gift":
            p.coins += Math.floor(Math.random()*10)+1;
            break;

        case "jackpot":
            p.coins += 15;
            break;

        case "thief":

            let target =
            Math.floor(Math.random()*4);

            while(target === currentPlayer){
                target =
                Math.floor(Math.random()*4);
            }

            players[target].coins -= 5;
            p.coins += 5;

            break;

        case "web":
            p.skip = true;
            break;
    }

    p.turns--;

    nextPlayer();

}

// ======================
// TOUR SUIVANT
// ======================

function nextPlayer(){

    currentPlayer++;

    if(currentPlayer > 3){
        currentPlayer = 0;
    }

}

// ======================
// DRAW
// ======================

function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(board.complete){

        ctx.drawImage(
            board,
            0,
            0,
            canvas.width,
            canvas.height
        );

    }

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";

    ctx.fillText(
        "Tour Joueur " + (currentPlayer+1),
        canvas.width/2 - 100,
        50
    );

    requestAnimationFrame(draw);

}

draw();
