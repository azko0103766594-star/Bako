console.log("gameState.js chargé");

// ======================
// ETAT DU JEU
// ======================

const players = [
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false },
    { coins: 0, turns: 15, skip: false }
];

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
