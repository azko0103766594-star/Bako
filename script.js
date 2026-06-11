const p1 = document.getElementById("player1");
const p2 = document.getElementById("player2");

function jump(player){
    let p = player === 1 ? p1 : p2;

    if(!p.classList.contains("jump")){
        p.classList.add("jump");

        setTimeout(()=>{
            p.classList.remove("jump");
        },500);
    }
}

document.addEventListener("keydown",(e)=>{
    if(e.key === "a") jump(1);
    if(e.key === "l") jump(2);
});

let obs1 = document.getElementById("obstacle1");
let obs2 = document.getElementById("obstacle2");

let pos1 = 700;
let pos2 = 1000;

setInterval(()=>{

    pos1 -= 8;
    pos2 -= 10;

    if(pos1 < -30) pos1 = 700;
    if(pos2 < -30) pos2 = 700;

    obs1.style.left = pos1 + "px";
    obs2.style.left = pos2 + "px";

},20);
