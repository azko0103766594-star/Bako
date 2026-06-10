let followers = 0;
let money = 0;
let running = false;

const posts = [
    "📸 Selfie devant un miroir",
    "🚗 Photo avec une voiture de luxe",
    "🏖️ Photo à la plage",
    "😂 Vidéo drôle",
    "🎵 Danse virale",
    "🔥 Publication polémique",
    "💎 Montre de luxe"
];

function startGame(){

    if(running) return;

    running = true;

    setInterval(() => {

        let post = posts[Math.floor(Math.random()*posts.length)];

        let gain = Math.floor(Math.random()*500)+50;

        followers += gain;
        money += Math.floor(gain/10);

        document.getElementById("followers").textContent = followers;
        document.getElementById("money").textContent = money;

        document.getElementById("action").textContent =
        "L'IA a publié : " + post;

        let div = document.createElement("div");
        div.className = "post";

        div.innerHTML =
        "<strong>"+post+"</strong><br>+" +
        gain + " abonnés";

        document.getElementById("feed").prepend(div);

        if(Math.random() < 0.15){

            let scandal = document.createElement("div");
            scandal.className = "post";

            followers -= 300;

            if(followers < 0){
                followers = 0;
            }

            scandal.innerHTML =
            "⚠️ Scandale ! L'IA a créé une polémique.<br>-300 abonnés";

            document.getElementById("feed").prepend(scandal);

            document.getElementById("followers").textContent = followers;
        }

    },3000);
}
