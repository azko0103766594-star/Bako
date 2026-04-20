// Boutons réserver => WhatsApp
document.querySelectorAll(".reserveBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    window.open("https://wa.me/22500000000", "_blank");
  });
});

// Lightbox Galerie
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeLightbox = document.getElementById("closeLightbox");

document.querySelectorAll(".gallery-img").forEach(img => {
  img.addEventListener("click", () => {
    lightbox.style.display = "flex";
    lightboxImg.src = img.src;
  });
});

closeLightbox.addEventListener("click", () => {
  lightbox.style.display = "none";
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.style.display = "none";
  }
});

// Formulaire contact
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();

  let name = document.getElementById("name").value;
  let phone = document.getElementById("phone").value;
  let message = document.getElementById("message").value;

  let text = `Bonjour LuxuryHotel,%0A%0AJe m'appelle ${name}.%0ATéléphone: ${phone}%0A%0AMessage:%0A${message}`;
  window.open(`https://wa.me/22500000000?text=${text}`, "_blank");
});
