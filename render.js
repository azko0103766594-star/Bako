console.log("render.js chargé");

// ======================
// IMAGES
// ======================

const board = new Image();
board.src = "plateau.png";

const arrow = new Image();
arrow.src = "fleche.png";

// ======================
// MENU PRINCIPAL
// ======================

function drawMainMenu() {

    ctx.fillStyle = "#111";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "LUDO GAME",
        canvas.width / 2,
        150
    );

    // Bouton amis

    ctx.fillStyle = "#2ecc71";

    ctx.fillRect(
        canvas.width / 2 - 250,
        250,
        500,
        100
    );

    ctx.fillStyle = "white";
    ctx.font = "bold 35px Arial";

    ctx.fillText(
        "JOUER ENTRE AMIS",
        canvas.width / 2,
        315
    );

    // Bouton IA

    ctx.fillStyle = "#3498db";

    ctx.fillRect(
        canvas.width / 2 - 250,
        420,
        500,
        100
    );

    ctx.fillStyle = "white";

    ctx.fillText(
        "JOUER AVEC IA",
        canvas.width / 2,
        485
    );
}

// ======================
// MENU AMIS
// ======================

function drawFriendsMenu() {

    ctx.fillStyle = "#111";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "JOUER ENTRE AMIS",
        canvas.width / 2,
        120
    );

    const buttons = [
        "PARTIE À 2",
        "PARTIE À 3",
        "PARTIE À 4",
        "RETOUR"
    ];

    for (let i = 0; i < buttons.length; i++) {

        ctx.fillStyle = "#2ecc71";

        ctx.fillRect(
            canvas.width / 2 - 220,
            200 + i * 130,
            440,
            90
        );

        ctx.fillStyle = "white";
        ctx.font = "bold 30px Arial";

        ctx.fillText(
            buttons[i],
            canvas.width / 2,
            255 + i * 130
        );
    }
}

// ======================
// MENU IA
// ======================

function drawAIMenu() {

    ctx.fillStyle = "#111";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "JOUER AVEC IA",
        canvas.width / 2,
        120
    );

    const buttons = [
        "PARTIE À 2",
        "PARTIE À 3",
        "PARTIE À 4",
        "RETOUR"
    ];

    for (let i = 0; i < buttons.length; i++) {

        ctx.fillStyle = "#3498db";

        ctx.fillRect(
            canvas.width / 2 - 220,
            200 + i * 130,
            440,
            90
        );

        ctx.fillStyle = "white";
        ctx.font = "bold 30px Arial";

        ctx.fillText(
            buttons[i],
            canvas.width / 2,
            255 + i * 130
        );
    }
}

// ======================
// DRAW
// ======================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

// ======================
// MENUS
// ======================

if (screen === "menu") {

    if (musicMenu.paused) {
        musicMenu.play();
    }

    drawMainMenu();

    requestAnimationFrame(draw);
    return;
}

if (screen === "friends") {

    drawFriendsMenu();

    requestAnimationFrame(draw);
    return;
}

if (screen === "ai") {

    drawAIMenu();

    requestAnimationFrame(draw);
    return;
}

    // ======================
// JEU
// ======================

if (board.complete) {

    const boardHeight = canvas.height * 0.90;

    const boardWidth =
        board.width *
        (boardHeight / board.height);

    ctx.drawImage(
        board,
        (canvas.width - boardWidth) / 2,
        (canvas.height - boardHeight) / 2,
        boardWidth,
        boardHeight
    );
}
ctx.fillStyle = "white";
ctx.font = "bold 30px Arial";
ctx.textAlign = "left";

if (playerCount === 2) {

    if (players[0])
        ctx.fillText(players[0].coins, 40, 100);

    if (players[1])
        ctx.fillText(
            players[1].coins,
            canvas.width - 80,
            canvas.height - 180
        );

} else {

    if (players[0])
        ctx.fillText(players[0].coins, 40, 100);

    if (players[1])
        ctx.fillText(
            players[1].coins,
            canvas.width - 80,
            100
        );

    if (players[2])
        ctx.fillText(
            players[2].coins,
            40,
            canvas.height - 180
        );

    if (players[3])
        ctx.fillText(
            players[3].coins,
            canvas.width - 80,
            canvas.height - 180
        );
}

ctx.fillStyle = "yellow";
ctx.font = "bold 40px Arial";
ctx.textAlign = "center";

ctx.fillText(
    "TOUR JOUEUR " + (currentPlayer + 1),
    canvas.width / 2,
    60
);

if (arrow.complete) {

    ctx.save();

    ctx.translate(
        canvas.width / 2,
        canvas.height / 2 + 100
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
if (gameOver) {

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "gold";
    ctx.font = "bold 60px Arial";

    ctx.fillText(
        "🏆 VICTOIRE",
        canvas.width / 2,
        120
    );

    ctx.fillStyle = "white";
    ctx.font = "bold 45px Arial";

    ctx.fillText(
        "JOUEUR " + (winner + 1),
        canvas.width / 2,
        200
    );

    // ======================
    // CLASSEMENT
    // ======================

    const ranking =
        [...players].sort(
            (a, b) =>
                b.coins - a.coins
        );

    ctx.font = "bold 30px Arial";

    for (
        let i = 0;
        i < ranking.length;
        i++
    ) {

        const originalIndex =
            players.indexOf(
                ranking[i]
            );

        ctx.fillText(
            (i + 1) +
            ". Joueur " +
            (originalIndex + 1) +
            " - " +
            ranking[i].coins +
            " pièces",
            canvas.width / 2,
            300 + i * 50
        );
    }

    // ======================
    // BOUTON REJOUER
    // ======================

    ctx.fillStyle = "#2ecc71";

    ctx.fillRect(
        canvas.width / 2 - 180,
        canvas.height - 220,
        360,
        70
    );

    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";

    ctx.fillText(
        "REJOUER",
        canvas.width / 2,
        canvas.height - 175
    );

    // ======================
// BOUTON MENU
// ======================

ctx.fillStyle = "#3498db";

ctx.fillRect(
    canvas.width / 2 - 180,
    canvas.height - 120,
    360,
    70
);

ctx.fillStyle = "white";

ctx.fillText(
    "MENU",
    canvas.width / 2,
    canvas.height - 75
);

}

// ======================
// BOUCLE DE DESSIN
// ======================

requestAnimationFrame(draw);

}

console.log("render.js OK");
