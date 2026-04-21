// WhatsApp réservation
function book(){
  window.open("https://wa.me/225000000000", "_blank");
}

// Lightbox open
function openImg(src){
  document.getElementById("lightbox").style.display = "flex";
  document.getElementById("lightboxImg").src = src;
}

// Close lightbox
function closeImg(){
  document.getElementById("lightbox").style.display = "none";
}
