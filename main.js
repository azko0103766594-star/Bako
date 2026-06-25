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

    // PARTAGER

    if (
        x >= canvas.width / 2 - 250 &&
        x <= canvas.width / 2 + 250 &&
        y >= 590 &&
        y <= 690
    ) {

        shareWhatsApp();
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
// ======================
// JEU
// ======================

if (spinning) return;

// PARTIE A 2 JOUEURS
if (playerCount === 2) {

    // Joueur 1 (haut gauche)
    if (
        currentPlayer === 0 &&
        x >= 0 &&
        x <= 250 &&
        y >= 0 &&
        y <= 250
    ) {

        soundClick.currentTime = 0;
        soundClick.play();

        spinWheel();
        return;
    }

    // Joueur 2 (bas droite)
    if (
        currentPlayer === 1 &&
        x >= canvas.width - 250 &&
        x <= canvas.width &&
        y >= canvas.height - 250 &&
        y <= canvas.height
    ) {

        soundClick.currentTime = 0;
        soundClick.play();

        spinWheel();
        return;
    }
}

// PARTIE A 3 OU 4 JOUEURS
else {

    // Joueur 1
    if (
        currentPlayer === 0 &&
        x >= 0 &&
        x <= 250 &&
        y >= 0 &&
        y <= 250
    ) {

        spinWheel();
        return;
    }

    // Joueur 2
    if (
        currentPlayer === 1 &&
        x >= canvas.width - 250 &&
        x <= canvas.width &&
        y >= 0 &&
        y <= 250
    ) {

        spinWheel();
        return;
    }

    // Joueur 3
    if (
        currentPlayer === 2 &&
        x >= 0 &&
        x <= 250 &&
        y >= canvas.height - 250 &&
        y <= canvas.height
    ) {

        spinWheel();
        return;
    }

    // Joueur 4
    if (
        currentPlayer === 3 &&
        x >= canvas.width - 250 &&
        x <= canvas.width &&
        y >= canvas.height - 250 &&
        y <= canvas.height
    ) {

        spinWheel();
        return;
    }
}

// fermeture du clic canvas
});

// ======================
// START GAME LOOP
// ======================

draw();

musicMenu.play();

console.log("JEU CHARGE OK");

function shareWhatsApp() {

    const text =
        "Viens jouer à mon jeu !";

    window.open(
        "https://wa.me/?text=" +
        encodeURIComponent(text)
    );
}

function shareFacebook() {

    const url =
        "https://ton-jeu.vercel.app";

    window.open(
        "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(url)
    );
}
