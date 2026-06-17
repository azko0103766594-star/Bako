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
// CLICK
// ======================

canvas.addEventListener("click", (e) => {

    const x = e.offsetX;
    const y = e.offsetY;

    console.log("Click :", x, y);

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

            console.log("JOUER ENTRE AMIS");

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

            console.log("JOUER AVEC IA");

            screen = "ai";

            return;
        }

        return;
    }

    // ======================
    // MENU AMIS
    // ======================

    if (screen === "friends") {

        // PARTIE À 2

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 200 &&
            y <= 290
        ) {

            console.log("PARTIE AMIS À 2");

gameMode = "friends";
startGame(2);

return;
screen = "game";

return;
        }   
        // PARTIE À 3

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 330 &&
            y <= 420
        ) {

            console.log("PARTIE AMIS À 3");

gameMode = "friends";
startGame(3);

return;
screen = "game";

return;
        }
        // PARTIE À 4

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 460 &&
            y <= 550
        ) {

            console.log("PARTIE AMIS À 4");

playerCount = 4;
gameMode = "friends";

createGame(4);

screen = "game";

return;
        }
        // RETOUR

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 590 &&
            y <= 680
        ) {

            console.log("RETOUR MENU");

            screen = "menu";

            return;
        }

        return;
    }

    // ======================
    // MENU IA
    // ======================

    if (screen === "ai") {

        // PARTIE À 2

        if (
            x >= canvas.width / 2 - 220 &&
            x <= canvas.width / 2 + 220 &&
            y >= 200 &&
            y <= 290
        ) {

            console.log("PARTIE IA À 2");

            playerCount = 2;
            gameMode = "ai";

            screen = "game";

            return;
        }

        // PARTIE À 3

// ======================
// MENU AMIS
// ======================

if (screen === "friends") {

    // PARTIE À 2

    if (
        x >= canvas.width / 2 - 220 &&
        x <= canvas.width / 2 + 220 &&
        y >= 200 &&
        y <= 290
    ) {

        console.log("PARTIE AMIS À 2");

        gameMode = "friends";
        startGame(2);

        return;
    }

    // PARTIE À 3

    if (
        x >= canvas.width / 2 - 220 &&
        x <= canvas.width / 2 + 220 &&
        y >= 330 &&
        y <= 420
    ) {

        console.log("PARTIE AMIS À 3");

        gameMode = "friends";
        startGame(3);

        return;
    }

    // PARTIE À 4

    if (
        x >= canvas.width / 2 - 220 &&
        x <= canvas.width / 2 + 220 &&
        y >= 460 &&
        y <= 550
    ) {

        console.log("PARTIE AMIS À 4");

        gameMode = "friends";
        startGame(4);

        return;
    }

    // RETOUR

    if (
        x >= canvas.width / 2 - 220 &&
        x <= canvas.width / 2 + 220 &&
        y >= 590 &&
        y <= 680
    ) {

        console.log("RETOUR MENU");

        screen = "menu";

        return;
    }

    return;
}
