// WhatsApp booking
function book(){
  window.open("https://wa.me/225000000000","_blank");
}

// LIGHTBOX
function openImg(src){
  document.getElementById("lightbox").style.display="flex";
  document.getElementById("lightboxImg").src=src;
}

function closeImg(){
  document.getElementById("lightbox").style.display="none";
}

// SCROLL ANIMATION (premium feel)
const elements = document.querySelectorAll(".fade");

window.addEventListener("scroll", () => {
  elements.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if(top < window.innerHeight - 100){
      el.classList.add("show");
    }
  });
});
