function onClick(e){

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
    // JOUEUR 3
    // JOUEUR 4
}