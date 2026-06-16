const players = [
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false }
];

let currentPlayer = 0;

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

    if(players[currentPlayer].ai){
        aiPlay();
    }
}