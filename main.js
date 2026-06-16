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

    if (spinning) return;
    if (gameOver) return;

    const x = e.offsetX;
    const y = e.offsetY;

    console.log("click:", x, y);

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