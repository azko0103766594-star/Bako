let money = 0;

const moneyText = document.getElementById("money");
const rankText = document.getElementById("rank");

document.getElementById("workBtn").onclick = () =>{
    money += 10;
    update();
};

function buy(price){
    if(money >= price){
        money -= price;
        update();
    }
}

function update(){

    moneyText.innerText = money + " €";

    if(money < 1000){
        rankText.innerText = "Pauvre";
        player.innerText = "😔";
        house.innerText = "🏚️";
        car.innerText = "🚶";
    }

    if(money >= 1000){
        rankText.innerText = "Travailleur";
        player.innerText = "🙂";
        house.innerText = "🏠";
        car.innerText = "🚲";
    }

    if(money >= 10000){
        rankText.innerText = "Patron";
        player.innerText = "😎";
        house.innerText = "🏡";
        car.innerText = "🚗";
    }

    if(money >= 100000){
        rankText.innerText = "Millionnaire";
        player.innerText = "🤑";
        house.innerText = "🏰";
        car.innerText = "🏎️";
    }
}

update();
