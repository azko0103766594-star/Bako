console.log("sounds.js chargé");
const soundThief = new Audio("thief.mp3");
const soundClick = new Audio("click.mp3");
const soundSpin = new Audio("spin.mp3");
const soundCoin = new Audio("coin.mp3");
const soundBomb = new Audio("bomb.mp3");
const soundVictory = new Audio("victory.mp3");
const musicMenu = new Audio("menu.mp3");

musicMenu.loop = true;
musicMenu.volume = 0.5;

musicMenu.addEventListener("canplaythrough", () => {
    console.log("Musique chargée");
});
