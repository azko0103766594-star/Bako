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

        // Retour au premier joueur
        if (currentPlayer >= players.length) {
            currentPlayer = 0;
        }

        // Joueur bloqué
        if (players[currentPlayer].skip) {

            players[currentPlayer].skip = false;
            players[currentPlayer].turns--;

            console.log(
                "Tour sauté joueur",
                currentPlayer + 1
            );

        } else {

            found = true;

        }
    }

    checkEndGame();
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

        console.log("FIN DU JEU");

        // Chercher le gagnant

        let winner = 0;

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
