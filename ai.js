function aiPlay(){

    if(spinning) return;
    if(gameOver) return;

    setTimeout(() => {

        spinWheel();

    }, 1500);

}
console.log("draw chargé");
