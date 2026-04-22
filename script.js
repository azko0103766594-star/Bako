function reserve(plat) {
  let message = `Bonjour, je souhaite réserver le plat : ${plat}`;

  let whatsapp = `https://wa.me/225000000000?text=` + encodeURIComponent(message);

  window.open(whatsapp, "_blank");
}

function openMap() {
  window.open("https://www.google.com/maps", "_blank");
}
