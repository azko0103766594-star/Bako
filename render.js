console.log("render.js chargé");

// ======================
// IMAGES
// ======================

const board = new Image();
board.src = "plateau.png";

const arrow = new Image();
arrow.src = "fleche.png";

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

    // plateau
    if (board.complete) {
        ctx.drawImage(board, 0, 0, canvas.width, canvas.height);
    }

    // scores
    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";

    ctx.fillText(players[0].coins, 40, 100);
    ctx.fillText(players[1].coins, canvas.width - 80, 100);
    ctx.fillText(players[2].coins, 40, canvas.height - 40);
    ctx.fillText(players[3].coins, canvas.width - 80, canvas.height - 40);

    // tour
    ctx.fillStyle = "yellow";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "TOUR JOUEUR " + (currentPlayer + 1),
        canvas.width / 2,
        60
    );

    // flèche
    if (arrow.complete) {

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

    // game over
    if (gameOver) {

        ctx.fillStyle = "white";
        ctx.font = "bold 50px Arial";
        ctx.fillText(
            "PARTIE TERMINÉE",
            canvas.width / 2,
            canvas.height / 2
        );
    }

    requestAnimationFrame(draw);
}