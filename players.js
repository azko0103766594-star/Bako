console.log("players.js chargé");

// ======================
// JOUEUR SUIVANT
// ======================

function nextPlayer() {

    console.log("nextPlayer()");

    if (gameOver) return;

    let found = false;

    while (!found) {

        currentPlayer++;

        if (currentPlayer >= players.length) {
            currentPlayer = 0;
        }

        if (players[currentPlayer].skip) {

            players[currentPlayer].skip = false;
            players[currentPlayer].turns--;

            console.log(
                "Tour sauté joueur",
                currentPlayer + 1
            );

        } else {

    found = true;

    if (currentPlayer === 2 || currentPlayer === 3) {
        cameraY = 150;
    } else {
        cameraY = 20;
    }

}

    checkEndGame();

    // ======================
    // TOUR IA
    // ======================

    if (
        !gameOver &&
        players[currentPlayer].isAI
    ) {

        console.log(
            "IA détectée : Joueur",
            currentPlayer + 1
        );

        setTimeout(() => {

            spinWheel();

        }, 1000);

    }
}

// ======================
// FIN DE PARTIE
// ======================

function checkEndGame() {

    console.log("checkEndGame()");

    let activePlayers = 0;

    for (let p of players) {

        if (p.turns > 0) {
            activePlayers++;
        }

    }

    if (activePlayers === 0) {

        gameOver = true;

soundVictory.currentTime = 0;
soundVictory.play();
        
        console.log("FIN DU JEU");

        winner = 0;

        for (let i = 1; i < players.length; i++) {

            if (
                players[i].coins >
                players[winner].coins
            ) {
                winner = i;
            }

        }

        console.log(
            "Gagnant : Joueur",
            winner + 1
        );

    }
}
