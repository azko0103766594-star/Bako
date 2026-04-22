function showPage(page){
  let sections = document.querySelectorAll(".page");
  sections.forEach(s => s.classList.remove("active"));

  document.getElementById(page).classList.add("active");
}

function reserver(plat){
  let msg = "Bonjour, je veux réserver : " + plat;
  let url = "https://wa.me/225000000000?text=" + encodeURIComponent(msg);
  window.open(url, "_blank");
}

function openWhatsApp(){
  window.open("https://wa.me/225000000000", "_blank");
}

function openEmail(){
  window.open("mailto:restaurant@gmail.com", "_blank");
}
