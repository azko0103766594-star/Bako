// Animation navbar au scroll
window.addEventListener("scroll", function(){
    const nav = document.querySelector(".navbar");
    nav.classList.toggle("scrolled", window.scrollY > 50);
});
