let money = 0;
let debt = 0;
let factories = 0;
let timer = 0;

const moneyTxt = document.getElementById("money");
const debtTxt = document.getElementById("debt");
const factoryTxt = document.getElementById("factories");
const timerTxt = document.getElementById("time");
const message = document.getElementById("message");

document.getElementById("borrowBtn").onclick = () => {

    if(debt > 0) return;

    money += 1000;
    debt = 2000;
    timer = 60;

    update();
};

document.getElementById("factoryBtn").onclick = () => {

    if(money >= 500){
        money -= 500;
        factories++;

        update();
    }
};

document.getElementById("payBtn").onclick = () => {

    if(money >= debt && debt > 0){

        money -= debt;
        debt = 0;
        timer = 0;

        message.innerText = "Dette remboursée ✅";
    }

    update();
};

setInterval(() => {

    money += factories * 10;

    if(debt > 0){

        timer--;

        if(timer <= 0){

            message.innerText =
            "👤 Le futur est venu récupérer sa dette !";

            money = Math.max(0, money - 1000);

            debt = 0;
            timer = 0;
        }
    }

    update();

},1000);

function update(){

    moneyTxt.innerText = Math.floor(money);
    debtTxt.innerText = debt;
    factoryTxt.innerText = factories;
    timerTxt.innerText = timer;
}
