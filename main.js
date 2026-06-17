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

    if (  
        x >= canvas.width / 2 - 220 &&  
        x <= canvas.width / 2 + 220 &&  
        y >= 330 &&  
        y <= 420  
    ) {  

        console.log("PARTIE IA À 3");  

        playerCount = 3;  
        gameMode = "ai";  

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

        console.log("PARTIE IA À 4");  

        playerCount = 4;  
        gameMode = "ai";  

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
// JEU  
// ======================  

if (spinning) return;  
if (gameOver) return;  

if (currentPlayer === 0 &&  
    x <= canvas.width * 0.18 &&  
    y <= canvas.height * 0.32) {  
    spinWheel();  
}  

if (currentPlayer === 1 &&  
    x >= canvas.width * 0.82 &&  
    y <= canvas.height * 0.32) {  
    spinWheel();  
}  

if (currentPlayer === 2 &&  
    y >= canvas.height * 0.68 &&  
    x <= canvas.width * 0.18) {  
    spinWheel();  
}  

if (currentPlayer === 3 &&  
    x >= canvas.width * 0.82 &&  
    y >= canvas.height * 0.68) {  
    spinWheel();  
}

});

// ======================
// START GAME LOOP
// ======================

draw();

console.log("JEU CHARGE OK");

const x = e.clientX;  
const y = e.clientY;  

// ======================  
// MENU AMIS  
// ======================  

if(screen === "friends"){  

    // Partie à 2  

    if(  
        x > canvas.width/2-220 &&  
        x < canvas.width/2+220 &&  
        y > 200 &&  
        y < 290  
    ){  
        console.log("PARTIE AMIS À 2");

gameMode = "friends";
startGame(2);

return;
}

// Partie à 3  

    if(  
        x > canvas.width/2-220 &&  
        x < canvas.width/2+220 &&  
        y > 330 &&  
        y < 420  
    ){  
        console.log("PARTIE AMIS À 3");

gameMode = "friends";
startGame(3);

return;
}

// Partie à 4  

    if(  
        x > canvas.width/2-220 &&  
        x < canvas.width/2+220 &&  
        y > 460 &&  
        y < 550  
    ){  
        console.log("PARTIE AMIS À 4");

gameMode = "friends";
startGame(4);

return;
}

// Retour  

    if(  
        x > canvas.width/2-220 &&  
        x < canvas.width/2+220 &&  
        y > 590 &&  
        y < 680  
    ){  
        screen = "menu";  
    }  
}

});
