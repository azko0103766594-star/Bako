const sun = document.getElementById("sun");
const player = document.getElementById("player");
const shadow = document.getElementById("shadow");

let playerX = 50;
let shadowWidth = 100;

document.addEventListener("mousemove", (e) => {

    sun.style.left = (e.clientX - 40) + "px";
    sun.style.top = (e.clientY - 40) + "px";

    shadowWidth = Math.abs(e.clientX - playerX) * 0.8;

    shadow.style.width = shadowWidth + "px";
});

setInterval(() => {

    playerX += 2;

    player.style.left = playerX + "px";
    shadow.style.left = playerX + "px";

}, 20);
