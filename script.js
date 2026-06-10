const player = document.getElementById("player");
const playBtn = document.getElementById("playBtn");
const menu = document.getElementById("menu");

let argent = 0;
let position = 0;

const frames = [
"images/walk1.png",
"images/walk2.png",
"images/walk3.png",
"images/walk4.png"
];

let frame = 0;

setInterval(()=>{
frame++;
if(frame >= frames.length) frame = 0;
player.src = frames[frame];
},150);

playBtn.onclick = () => {

menu.style.display = "none";

marcher();

};

function marcher(){

const move = setInterval(()=>{

position += 4;

player.style.left = position + "px";

if(position >= 350){

clearInterval(move);

travailler(5);

}

if(position >= 850){

clearInterval(move);

travailler(10);

}

if(position >= 1350){

clearInterval(move);

travailler(20);

}

},20);

}

function travailler(gain){

setTimeout(()=>{

argent += gain;

document.getElementById("money").innerHTML =
argent + " €";

position += 150;

marcher();

if(argent >= 500){

document.getElementById("status").innerHTML =
"Riche 🏆";

}

},2000);

}