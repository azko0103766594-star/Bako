let money = 0;

const moneyText = document.getElementById("money");
const progressFill = document.getElementById("progressFill");
const unlockShop = document.getElementById("unlockShop");

function work(amount){

    money += amount;

    moneyText.innerHTML = "💰 " + money + " €";

    let percent = (money / 500) * 100;

    if(percent > 100){
        percent = 100;
    }

    progressFill.style.width = percent + "%";

    if(money >= 500){
        unlockShop.style.display = "block";
    }
}
