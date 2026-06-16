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

const board = new Image();
board.src = "plateau.png";

const arrow = new Image();
arrow.src = "fleche.png";

// ======================
// JOUEURS
// ======================

const players = [
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false }
];

let currentPlayer = 0;

// ======================
// ROUE
// ======================

let angle = 0;
let spinning = false;
let gameOver = false;
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

canvas.addEventListener("click", (e) => {

    if (spinning) return;
    if (gameOver) return;

    const x = e.offsetX;
    const y = e.offsetY;

    // JOUEUR 1
    if (
        currentPlayer === 0 &&
        x >= 0 &&
        x <= canvas.width * 0.18 &&
        y >= 0 &&
        y <= canvas.height * 0.32
    ) {
        spinWheel();
    }

    // JOUEUR 2
    if (
        currentPlayer === 1 &&
        x >= canvas.width * 0.82 &&
        x <= canvas.width &&
        y >= 0 &&
        y <= canvas.height * 0.32
    ) {
        spinWheel();
    }

    // JOUEUR 3
    if (
        currentPlayer === 2 &&
        x >= 0 &&
        x <= canvas.width * 0.18 &&
        y >= canvas.height * 0.68 &&
        y <= canvas.height
    ) {
        spinWheel();
    }

    // JOUEUR 4
    if (
        currentPlayer === 3 &&
        x >= canvas.width * 0.82 &&
        x <= canvas.width &&
        y >= canvas.height * 0.68 &&
        y <= canvas.height
    ) {
        spinWheel();
    }

});

// ======================
// TOURNER
// ======================

function spinWheel() {

    spinning = true;

    const extra =
        (Math.random() * Math.PI * 2);

    const target =
        angle +
        (Math.PI * 2 * 8) +
        extra;

    const startAngle = angle;

    const duration = 3000;
    const startTime = performance.now();

    function animate(time) {

        let progress =
            (time - startTime) / duration;

        if (progress > 1) progress = 1;

        const ease =
            1 - Math.pow(1 - progress, 3);

        angle =
            startAngle +
            (target - startAngle) * ease;

        if (progress < 1) {

            requestAnimationFrame(animate);

        } else {

            spinning = false;

            calculateReward();

        }
    }

    requestAnimationFrame(animate);
}

// ======================
// RECOMPENSE
// ======================

function calculateReward() {

    const segment =
        (Math.PI * 2) / rewards.length;

    let a =
        angle % (Math.PI * 2);

    const index =
        Math.floor(a / segment);

    const reward =
        rewards[index];

    applyReward(reward);
}

// ======================
// EFFETS
// ======================

function applyReward(type) {

    const p = players[currentPlayer];

    switch(type) {

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
            p.coins +=
            Math.floor(Math.random()*10)+1;
            break;

        case "jackpot":
            p.coins += 15;
            break;

        case "thief":

            let target =
            Math.floor(Math.random()*4);

            while(target === currentPlayer) {
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
// JOUEUR SUIVANT
// ======================

function nextPlayer() {

    let found = false;

    while(!found) {

        currentPlayer++;

        if(currentPlayer > 3) {
            currentPlayer = 0;
        }

        if(players[currentPlayer].skip) {

            players[currentPlayer].skip = false;
            players[currentPlayer].turns--;

        } else {

            found = true;
        }
    }

    checkEndGame();
}

// ======================
// DESSIN
// ======================
function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // ======================
    // PLATEAU
    // ======================

    if(board.complete) {
    ctx.fillStyle = "green";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
    }
    // ======================
    // SCORES
    // ======================

    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "left";

    ctx.fillText(
        players[0].coins,
        40,
        100
    );

    ctx.fillText(
        players[1].coins,
        canvas.width - 80,
        100
    );

    ctx.fillText(
        players[2].coins,
        40,
        canvas.height - 40
    );

    ctx.fillText(
        players[3].coins,
        canvas.width - 80,
        canvas.height - 40
    );

    // ======================
    // TOUR ACTUEL
    // ======================

    ctx.fillStyle = "yellow";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "TOUR JOUEUR " + (currentPlayer + 1),
        canvas.width / 2,
        60
    );

    // ======================
    // ASSOMBRIR LES AUTRES
    // ======================

    ctx.fillStyle = "rgba(0,0,0,0.45)";

    if(currentPlayer !== 0){
        ctx.fillRect(
            0,
            0,
            canvas.width * 0.18,
            canvas.height * 0.32
        );
    }

    if(currentPlayer !== 1){
        ctx.fillRect(
            canvas.width * 0.82,
            0,
            canvas.width * 0.18,
            canvas.height * 0.32
        );
    }

    if(currentPlayer !== 2){
        ctx.fillRect(
            0,
            canvas.height * 0.68,
            canvas.width * 0.18,
            canvas.height * 0.32
        );
    }

    if(currentPlayer !== 3){
        ctx.fillRect(
            canvas.width * 0.82,
            canvas.height * 0.68,
            canvas.width * 0.18,
            canvas.height * 0.32
        );
    }

    // ======================
    // FLECHE
    // ======================

    if(arrow.complete) {

        ctx.save();

        ctx.translate(
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.rotate(angle);

        ctx.drawImage(
            arrow,
            -25,
            -90,
            50,
            120
        );

        ctx.restore();
    }

    // ======================
// FIN DE PARTIE
// ======================

if(gameOver){

    ctx.fillStyle = "white";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "PARTIE TERMINEE",
        canvas.width / 2,
        canvas.height / 2
    );
}

requestAnimationFrame(draw);

} // <- ferme la fonction draw()

draw();

console.log("JEU CHARGE");
