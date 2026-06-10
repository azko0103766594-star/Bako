const sun = document.getElementById("sun");
const player = document.getElementById("player");
const shadow = document.getElementById("shadow");

let playerX = 50;

document.addEventListener("mousemove",(e)=>{

    sun.style.left = e.clientX - 40 + "px";
    sun.style.top = e.clientY - 40 + "px";

    const distance =
    Math.abs(e.clientX - playerX);

    shadow.style.width =
    (distance * 0.8) + "px";

});

setInterval(()=>{

    playerX += 2;

    player.style.left = playerX + "px";

    shadow.style.left = playerX + "px";

    const shadowWidth =
    parseInt(shadow.style.width) || 0;

    const shadowEnd =
    playerX + shadowWidth;

    if(playerX > 400 && playerX < 600){

        if(shadowEnd < 600){

            alert("💀 Tu es tombé !");
            location.reload();
        }
    }

    if(playerX > window.innerWidth - 100){

        alert("🏆 Niveau terminé !");
        location.reload();
    }

},20);
