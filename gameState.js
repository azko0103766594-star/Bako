console.log("gameState.js chargé");

// ======================
// ETAT DU JEU
// ======================

let players = [];

let currentPlayer = 0;

let angle = 0;
let spinning = false;
let gameOver = false;

let winner = null;

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
// MENUS
// ======================

let screen = "menu";

let gameMode = null;
let playerCount = 0;

// ======================
// CREATION PARTIE
// ======================

function createGame(nbPlayers) {

    playerCount = nbPlayers;

    players = [];

    for (let i = 0; i < nbPlayers; i++) {

        players.push({
            coins: 0,
            turns: 15,
            skip: false,
            isAI: false
        });

    }

    // IA

    if (gameMode === "ai") {

        for (let i = 1; i < players.length; i++) {
            players[i].isAI = true;
        }

    }

    currentPlayer = 0;
    angle = 0;
    spinning = false;
    gameOver = false;
    winner = null;

    screen = "game";

    console.log(
        "Partie créée :",
        nbPlayers,
        "joueurs"
    );
}
