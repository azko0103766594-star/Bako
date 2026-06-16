function draw() {

    ctx.fillStyle = "red";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    requestAnimationFrame(draw);
}

console.log("draw chargé");
