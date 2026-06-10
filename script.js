let money = Number(localStorage.getItem("money")) || 0;
let income = Number(localStorage.getItem("income")) || 0;

function work(){
    money++;
    update();
}

function buy(price,gain){

    if(money >= price){
        money -= price;
        income += gain;
        update();
    }
}

function update(){

    document.getElementById("money").innerHTML =
        money.toLocaleString() + " €";

    document.getElementById("income").innerHTML =
        "Revenu : " + income.toLocaleString() + " €/s";

    let rank = "🏚️ Pauvre";
    let character = "🧍";

    if(money >= 1000){
        rank = "👷 Travailleur";
        character = "👷";
    }

    if(money >= 10000){
        rank = "🛒 Commerçant";
        character = "🧑‍💼";
    }

    if(money >= 100000){
        rank = "💼 Patron";
        character = "🤵";
    }

    if(money >= 1000000){
        rank = "🤑 Millionnaire";
        character = "🤑";
    }

    if(money >= 1000000000){
        rank = "👑 Milliardaire";
        character = "👑";
    }

    document.getElementById("rank").innerHTML = rank;
    document.getElementById("character").innerHTML = character;

    localStorage.setItem("money", money);
    localStorage.setItem("income", income);
}

setInterval(() => {
    money += income;
    update();
}, 1000);

update();
