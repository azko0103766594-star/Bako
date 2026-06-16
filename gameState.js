console.log("gameState.js chargé");

// ======================
// ======================
// ETAT DU JEU
// ======================

let players = [];

let currentPlayer = 0;

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
// MENUS
// ======================

let screen = "menu";

let gameMode = null;
let playerCount = 0;

function createGame(nbPlayers) {

    players = [];

    for (let i = 0; i < nbPlayers; i++) {

        players.push({
            coins: 0,
            turns: 15,
            skip: false
        });

    }

    currentPlayer = 0;
    angle = 0;
    spinning = false;
    gameOver = false;

    console.log("Partie créée :", nbPlayers);
}
