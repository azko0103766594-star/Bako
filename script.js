const player = document.getElementById("player");

let argent = 0;
let frame = 0;
let position = 350;

const frames = [
"walk1.png",
"walk2.png",
"walk3.png",
"walk4.png"
];

setInterval(() => {

    frame++;

    if(frame >= frames.length){
        frame = 0;
    }

    player.src = frames[frame];

}, 150);

setInterval(() => {

    position += 2;

    if(position > window.innerWidth){
        position = -200;
    }

    player.style.left = position + "px";

}, 20);

function gagner(montant){

    argent += montant;

    document.getElementById("money").textContent = argent;

    let pourcentage = (argent / 500) * 100;

    if(pourcentage > 100){
        pourcentage = 100;
    }

    document.querySelector(".progress-fill").style.width =
    pourcentage + "%";

}
