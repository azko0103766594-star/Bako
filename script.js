let time = 0;
let money = 0;
let machines = 0;
let anomalies = 0;

let historyData = [];

function update(){

    document.getElementById("time").textContent = Math.floor(time);
    document.getElementById("money").textContent = money;
    document.getElementById("machines").textContent = machines;
    document.getElementById("anomalies").textContent = anomalies;

    let level = "Atelier";

    if(time >= 1000) level = "Usine";
    if(time >= 10000) level = "Ville Temporelle";
    if(time >= 50000) level = "Planète Temporelle";
    if(time >= 100000) level = "Univers Temporel";

    document.getElementById("level").textContent = level;
}

function log(text){
    const div = document.createElement("div");
    div.textContent = text;
    document.getElementById("log").prepend(div);
}

function makeTime(){
    time += 1;
    update();
}

function sellTime(){

    if(time < 1){
        log("Pas assez de temps.");
        return;
    }

    money += Math.floor(time);
    log("Temps vendu : +" + Math.floor(time) + " pièces");

    time = 0;

    update();
}

function buyMachine(){

    if(money < 50){
        log("Il faut 50 pièces.");
        return;
    }

    money -= 50;
    machines++;

    log("Machine achetée.");

    update();
}

function rewindTime(){

    if(historyData.length < 30){
        log("Pas assez d'historique.");
        return;
    }

    let save = historyData[0];

    time = save.time;
    money = save.money;
    machines = save.machines;

    anomalies++;

    log("🔄 Retour dans le temps !");
    log("👤 Une anomalie est apparue.");

    update();
}

setInterval(() => {

    time += machines;

    historyData.unshift({
        time,
        money,
        machines
    });

    if(historyData.length > 30){
        historyData.pop();
    }

    update();

},1000);

update();
