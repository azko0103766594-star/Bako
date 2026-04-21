// Site frontend statique - aucune action réelle

console.log("Luxury Car Rental Dubai UI loaded");

// Effet visuel simple (optionnel)
document.querySelectorAll(".card").forEach(card => {
card.addEventListener("mouseenter", () => {
card.style.boxShadow = "0 0 15px rgba(212,175,55,0.3)";
});

card.addEventListener("mouseleave", () => {
card.style.boxShadow = "none";
});
});
