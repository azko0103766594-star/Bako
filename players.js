console.log("players.js chargé");

function nextPlayer() {

    console.log("nextPlayer()");

    let found = false;

    while (!found) {

        currentPlayer++;

        if (currentPlayer > 3) {
            currentPlayer = 0;
        }

        if (players[currentPlayer].skip) {

            players[currentPlayer].skip = false;
            players[currentPlayer].turns--;

            console.log("Skip joueur:", currentPlayer);

        } else {
            found = true;
        }
    }

    checkEndGame();
}

function checkEndGame() {

    console.log("checkEndGame()");

    let active = 0;

    for (let p of players) {
        if (p.turns > 0) active++;
    }

    if (active === 0) {
        gameOver = true;
        console.log("FIN DU JEU");
    }
}