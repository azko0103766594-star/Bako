let money = 0;
const goal = 500;

function work(amount){

    money += amount;

    document.getElementById("money").textContent =
        money + " €";

    document.getElementById("goalText").textContent =
        money + " / " + goal + " €";

    document.getElementById("bar").style.width =
        (money / goal * 100) + "%";
}
