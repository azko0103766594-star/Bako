// MENU MOBILE
const btn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

btn.onclick = () => {
nav.style.display = nav.style.display === "flex" ? "none" : "flex";
};

// SLIDER HERO
let slides = document.querySelectorAll(".slide");
let index = 0;

function showSlide() {
slides.forEach(s => s.classList.remove("active"));
slides[index].classList.add("active");

index++;
if(index >= slides.length) index = 0;
}

setInterval(showSlide, 3000);

// FORM WHATSAPP
document.getElementById("form").addEventListener("submit", function(e){
e.preventDefault();

let text = "Bonjour je veux réserver une chambre";
let url = "https://wa.me/225000000000?text=" + encodeURIComponent(text);

window.open(url, "_blank");
});
