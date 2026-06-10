let money = 0;
let income = 0;

const moneyText = document.getElementById("money");
const incomeText = document.getElementById("income");

document.getElementById("tapBtn").addEventListener("click", () => {
    money += 1;
    update();
});

function buyBalai(){
    if(money >= 50){
        money -= 50;
        income += 1;
        update();
    }
}

function buyVelo(){
    if(money >= 500){
        money -= 500;
        income += 10;
        update();
    }
}

function update(){
    moneyText.textContent = money + " €";
    incomeText.textContent = "Revenu : " + income + "€/s";
}

setInterval(() => {
    money += income;
    update();
}, 1000);
