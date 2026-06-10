let followers = 0;
let money = 0;
let reputation = 100;
let started = false;

const publications = [
    {
        title:"📸 Selfie viral",
        text:"NovaAI publie un selfie futuriste.",
        gain:120
    },
    {
        title:"😂 Vidéo drôle",
        text:"Une vidéo fait rire internet.",
        gain:250
    },
    {
        title:"🎵 Danse tendance",
        text:"NovaAI suit une tendance TikTok.",
        gain:400
    },
    {
        title:"🚗 Voiture de luxe",
        text:"Photo devant une supercar.",
        gain:600
    },
    {
        title:"🏝 Voyage paradisiaque",
        text:"Photo dans une île privée.",
        gain:900
    }
];

const comments = [
    "Incroyable 😍",
    "Je suis fan ❤️",
    "Cette IA est trop forte 🔥",
    "Fake 😂",
    "Premier commentaire !",
    "J'adore ce contenu 👏"
];

function createPost(title,text,gain){

    const feed = document.getElementById("feed");

    const div = document.createElement("div");
    div.className = "post";

    let comment =
        comments[Math.floor(Math.random()*comments.length)];

    div.innerHTML = `
        <h3>${title}</h3>
        <p>${text}</p>
        <br>
        <small>+${gain} abonnés</small>
        <br><br>
        <strong>💬 ${comment}</strong>
    `;

    feed.prepend(div);
}

function updateStats(){
    document.getElementById("followers").textContent =
        followers.toLocaleString();

    document.getElementById("money").textContent =
        money.toLocaleString() + "€";

    document.getElementById("reputation").textContent =
        reputation + "%";
}

function generateContent(){

    const post =
        publications[Math.floor(Math.random()*publications.length)];

    followers += post.gain;
    money += Math.floor(post.gain/5);

    createPost(post.title,post.text,post.gain);

    if(Math.random() < 0.15){

        reputation -= 5;

        const scandal = document.createElement("div");
        scandal.className = "post";

        scandal.innerHTML = `
            <h3>⚠️ Scandale</h3>
            <p>Une polémique éclate sur internet.</p>
            <br>
            <strong>-5% réputation</strong>
        `;

        document.getElementById("feed").prepend(scandal);
    }

    if(reputation < 0){
        reputation = 0;
    }

    updateStats();
}

document.getElementById("startBtn")
.addEventListener("click",function(){

    if(started) return;

    started = true;

    createPost(
        "🚀 Début de carrière",
        "NovaAI vient de créer son compte.",
        0
    );

    setInterval(generateContent,3000);
});
