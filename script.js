const cars = [
  {
    name: "Mercedes-Benz Classe G 63 AMG",
    price: "250€/jour",
    fuel: "14.5L / 100km",
    desc: "SUV ultra luxueux, puissant et parfait pour une expérience premium.",
    img: "https://images.unsplash.com/photo-1617650725880-8a34f2c2e4a5?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "BMW M4 Competition",
    price: "180€/jour",
    fuel: "10.2L / 100km",
    desc: "Coupé sportif avec une accélération impressionnante et un design agressif.",
    img: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Audi RS7 Sportback",
    price: "220€/jour",
    fuel: "11.5L / 100km",
    desc: "Une berline sportive et élégante, idéale pour business et luxe.",
    img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Lamborghini Huracán",
    price: "950€/jour",
    fuel: "13.7L / 100km",
    desc: "Supercar mythique, performance extrême, bruit incroyable et prestige total.",
    img: "https://images.unsplash.com/photo-1626443252295-0a0f9e1c1d06?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Ferrari 488 GTB",
    price: "1100€/jour",
    fuel: "12.8L / 100km",
    desc: "Ferrari haute performance, parfaite pour un événement ou un mariage.",
    img: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Range Rover Vogue",
    price: "260€/jour",
    fuel: "12.2L / 100km",
    desc: "SUV prestigieux, confort maximum et présence incroyable sur route.",
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Porsche 911 Carrera",
    price: "450€/jour",
    fuel: "9.5L / 100km",
    desc: "Icône sportive, conduite précise et élégance intemporelle.",
    img: "https://images.unsplash.com/photo-1603386329225-8b88c06b0c3f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Tesla Model S Plaid",
    price: "350€/jour",
    fuel: "Électrique (600km)",
    desc: "Puissance extrême, accélération record, technologie et luxe futuriste.",
    img: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Rolls-Royce Ghost",
    price: "1500€/jour",
    fuel: "15.8L / 100km",
    desc: "Luxe absolu, parfait pour VIP, mariage et événements haut de gamme.",
    img: "https://images.unsplash.com/photo-1606664488175-2e1f3f9b8e39?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Bentley Continental GT",
    price: "1200€/jour",
    fuel: "14.0L / 100km",
    desc: "Grand tourisme de luxe, finition parfaite et moteur très puissant.",
    img: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=1200&q=80"
  }
];

const carsGrid = document.getElementById("carsGrid");
const carSelect = document.getElementById("carSelect");

// Render cars
cars.forEach((car, index) => {
  const card = document.createElement("div");
  card.classList.add("car-card");

  card.innerHTML = `
    <img src="${car.img}" alt="${car.name}">
    <div class="car-info">
      <h3>${car.name}</h3>
      <p>${car.desc}</p>

      <div class="car-details">
        <span>💰 Prix: <b>${car.price}</b></span>
        <span>⛽ Consommation: <b>${car.fuel}</b></span>
      </div>

      <div class="car-actions">
        <a class="action-btn reserve" href="#reservation" onclick="selectCar(${index})">Réserver</a>
        <a class="action-btn details" href="https://wa.me/2250700000000?text=Bonjour,%20je%20veux%20plus%20d'informations%20sur%20la%20voiture%20${encodeURIComponent(car.name)}" target="_blank">Infos WhatsApp</a>
      </div>
    </div>
  `;

  carsGrid.appendChild(card);

  // Add options in select
  const option = document.createElement("option");
  option.value = car.name;
  option.textContent = car.name + " - " + car.price;
  carSelect.appendChild(option);
});

// Select car in reservation form
function selectCar(index) {
  carSelect.value = cars[index].name;
  window.location.href = "#reservation";
}

// Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
});

// Reservation form send WhatsApp
const reservationForm = document.getElementById("reservationForm");

reservationForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value;
  const phone = document.getElementById("phone").value;
  const email = document.getElementById("email").value;
  const car = document.getElementById("carSelect").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const message = document.getElementById("message").value;

  if (!car) {
    alert("Veuillez choisir une voiture.");
    return;
  }

  const whatsappNumber = "2250700000000";

  const text =
    `🚗 *Nouvelle Réservation LUX AUTO* \n\n` +
    `👤 Nom: ${fullname}\n` +
    `📞 Téléphone: ${phone}\n` +
    `📧 Email: ${email}\n\n` +
    `🚘 Voiture: ${car}\n` +
    `📅 Départ: ${startDate}\n` +
    `📅 Retour: ${endDate}\n\n` +
    `📝 Message: ${message}\n\n` +
    `Merci.`;

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
});
