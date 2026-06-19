console.log("main.js chargé");

// ======================
// CANVAS
// ======================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// ======================
// ======================
// CLICK
// ======================

canvas.addEventListener("click", (e) => {

soundClick.currentTime = 0;
soundClick.play();
   
    const x = e.offsetX;
    const y = e.offsetY;

    console.log("Click :", x, y);

    // ======================
    // FIN DE PARTIE
    // ======================

    if (gameOver) {

        // REJOUER

        if (
            x >= canvas.width / 2 - 180 &&
            x <= canvas.width / 2 + 180 &&
            y >= canvas.height - 220 &&
            y <= canvas.height - 130
        ) {

            createGame(playerCount);
            return;
        }

        // MENU

        if (
            x >= canvas.width / 2 - 180 &&
            x <= canvas.width / 2 + 180 &&
            y >= canvas.height - 120 &&
            y <= canvas.height - 50
        ) {

            screen = "menu";
            return;
        }

        return;
    }

// ======================
// MENU PRINCIPAL
// ======================

if (screen === "menu") {

    // JOUER ENTRE AMIS

    if (
        x >= canvas.width / 2 - 250 &&
        x <= canvas.width / 2 + 250 &&
        y >= 250 &&
        y <= 350
    ) {

        if (musicMenu.paused) {
            musicMenu.play();
        }

        screen = "friends";
        return;
    }

    // JOUER AVEC IA

    if (
        x >= canvas.width / 2 - 250 &&
        x <= canvas.width / 2 + 250 &&
        y >= 420 &&
        y <= 520
    ) {

        if (musicMenu.paused) {
            musicMenu.play();
        }

        screen = "ai";
        return;
    }

    return;
}

    // ======================
    // MENU AMIS
    // ======================

    if (screen === "friends") {

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 200 &&
            y <= 290
        ) {
            gameMode = "friends";
            createGame(2)
            return;
        }

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 330 &&
            y <= 420
        ) {
            gameMode = "friends";
            createGame(3)
            return;
        }

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 460 &&
            y <= 550
        ) {
            gameMode = "friends";
            createGame(4)
            return;
        }

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 590 &&
            y <= 680
        ) {
            screen = "menu";
            return;
        }

        return;
    }

    // ======================
    // MENU IA
    // ======================

    if (screen === "ai") {

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 200 &&
            y <= 290
        ) {
           gameMode = "ai";

musicMenu.pause();
musicMenu.currentTime = 0;

createGame(2);
return;
        }

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 330 &&
            y <= 420
        ) {
            gameMode = "ai";

musicMenu.pause();
musicMenu.currentTime = 0;

createGame(3);
return;
        }

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 460 &&
            y <= 550
        ) {
            gameMode = "ai";

musicMenu.pause();
musicMenu.currentTime = 0;

createGame(4);
return;
        }

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 590 &&
            y <= 680
        ) {
            screen = "menu";
            return;
        }

        return;
    }

// ======================
// JEU
// ======================

if (spinning) return;

if (
    currentPlayer === 0 &&
    x <= canvas.width * 0.18 &&
    y <= canvas.height * 0.32
) {

    soundClick.currentTime = 0;
    soundClick.play();

    spinWheel();
}

if (
    currentPlayer === 1 &&
    x >= canvas.width * 0.82 &&
    y <= canvas.height * 0.32
) {

    soundClick.currentTime = 0;
    soundClick.play();

    spinWheel();
}

if (
    currentPlayer === 2 &&
    x <= canvas.width * 0.18 &&
    y >= canvas.height * 0.68
) {

    soundClick.currentTime = 0;
    soundClick.play();

    spinWheel();
}

if (
    currentPlayer === 3 &&
    x >= canvas.width * 0.82 &&
    y >= canvas.height * 0.68
) {

    soundClick.currentTime = 0;
    soundClick.play();

    spinWheel();
}

}); // fermeture du canvas.addEventListener

// ======================
// START GAME LOOP
// ======================

draw();

musicMenu.play();

console.log("JEU CHARGE OK");
