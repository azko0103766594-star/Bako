const rooms = [
  {
    name: "Suite Royale Prestige",
    price: "350€ / nuit",
    size: "75m²",
    bed: "King Size",
    view: "Vue panoramique",
    img: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1600&q=80",
    desc: "Suite premium ultra luxe avec salon privé, baignoire design, balcon panoramique, mini-bar et service VIP."
  },
  {
    name: "Chambre Deluxe Gold",
    price: "220€ / nuit",
    size: "45m²",
    bed: "Queen Size",
    view: "Vue ville",
    img: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1600&q=80",
    desc: "Chambre élégante avec décoration moderne, douche italienne, éclairage ambiance et literie haut de gamme."
  },
  {
    name: "Suite Business Executive",
    price: "280€ / nuit",
    size: "60m²",
    bed: "King Size",
    view: "Vue skyline",
    img: "https://images.unsplash.com/photo-1551887373-6a5bd5c4c9a3?auto=format&fit=crop&w=1600&q=80",
    desc: "Parfaite pour les voyages d’affaires : bureau privé, WiFi premium, coin salon et design luxueux."
  },
  {
    name: "Chambre Luxe Ocean View",
    price: "240€ / nuit",
    size: "50m²",
    bed: "Queen Size",
    view: "Vue mer",
    img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
    desc: "Chambre lumineuse avec vue mer exceptionnelle, balcon privé, décoration blanche premium et confort absolu."
  },
  {
    name: "Suite Diamond Jacuzzi",
    price: "400€ / nuit",
    size: "85m²",
    bed: "King Size",
    view: "Vue VIP",
    img: "https://images.unsplash.com/photo-1560067174-8943bd07dbc7?auto=format&fit=crop&w=1600&q=80",
    desc: "Suite ultra prestige avec jacuzzi privé, salle de bain marbre, service premium et ambiance romantique."
  },
  {
    name: "Chambre Signature Modern",
    price: "190€ / nuit",
    size: "40m²",
    bed: "Queen Size",
    view: "Vue jardin",
    img: "https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1600&q=80",
    desc: "Chambre moderne et raffinée, parfaite pour couples, avec vue jardin, lumière naturelle et style minimal luxe."
  },
  {
    name: "Suite Panorama Sky",
    price: "320€ / nuit",
    size: "70m²",
    bed: "King Size",
    view: "Vue rooftop",
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
    desc: "Suite luxueuse avec balcon rooftop, salon élégant, télévision premium et vue skyline impressionnante."
  },
  {
    name: "Chambre Family Premium",
    price: "210€ / nuit",
    size: "55m²",
    bed: "2 lits Queen",
    view: "Vue piscine",
    img: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=1600&q=80",
    desc: "Idéale pour familles : grande chambre, espace enfants, vue piscine, design chaleureux et confort premium."
  },
  {
    name: "Suite Romantic Luxury",
    price: "300€ / nuit",
    size: "65m²",
    bed: "King Size",
    view: "Vue nocturne",
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80",
    desc: "Suite romantique avec éclairage doux, baignoire design, ambiance luxe parfaite pour un séjour amoureux."
  },
  {
    name: "Chambre Classic Elite",
    price: "160€ / nuit",
    size: "38m²",
    bed: "Queen Size",
    view: "Vue intérieure",
    img: "https://images.unsplash.com/photo-1501117716987-c8e1ecb21000?auto=format&fit=crop&w=1600&q=80",
    desc: "Chambre élégante classique avec finitions premium, salle de bain moderne et confort idéal à prix accessible."
  }
];

const roomsGrid = document.getElementById("roomsGrid");

const hotelWhatsapp = "2250102030405"; 
const hotelEmail = "royalpearlhotel@gmail.com";

function createRoomCard(room) {
  const message = `Bonjour, je souhaite réserver la chambre : ${room.name} (${room.price}). Merci.`;

  const whatsappLink = `https://wa.me/${hotelWhatsapp}?text=${encodeURIComponent(message)}`;
  const gmailLink = `mailto:${hotelEmail}?subject=Réservation%20${encodeURIComponent(room.name)}&body=${encodeURIComponent(message)}`;
  const fbLink = `https://facebook.com`;
  const instaLink = `https://instagram.com`;

  return `
    <div class="room-card">
      <img class="room-img" src="${room.img}" alt="${room.name}">
      <div class="room-content">
        <h3>${room.name}</h3>
        <p>${room.desc}</p>

        <div class="room-info">
          <span class="badge">${room.price}</span>
          <span class="badge">${room.size}</span>
          <span class="badge">${room.bed}</span>
          <span class="badge">${room.view}</span>
        </div>

        <div class="room-buttons">
          <a class="btn btn-gold" href="${whatsappLink}" target="_blank">WhatsApp</a>
          <a class="btn btn-white" href="${gmailLink}">Gmail</a>
          <a class="btn btn-outline" href="${fbLink}" target="_blank">Facebook</a>
          <a class="btn btn-outline" href="${instaLink}" target="_blank">Instagram</a>
        </div>
      </div>
    </div>
  `;
}

rooms.forEach(room => {
  roomsGrid.innerHTML += createRoomCard(room);
});

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

// MENU MOBILE
const menuToggle = document.getElementById("menuToggle");
const menu = document.querySelector(".menu");

menuToggle.addEventListener("click", () => {
  menu.classList.toggle("active");
});
