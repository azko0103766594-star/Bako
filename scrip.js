// --------------------
// MENU MOBILE
// --------------------
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

menuBtn.addEventListener("click", () => {
  menu.classList.toggle("active");
});

document.querySelectorAll(".menu a").forEach(link => {
  link.addEventListener("click", () => {
    menu.classList.remove("active");
  });
});

// --------------------
// LIGHTBOX GALLERY
// --------------------
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

// --------------------
// SCROLL ANIMATION (fade)
// --------------------
const faders = document.querySelectorAll(".fade");

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.15 });

faders.forEach(el => observer.observe(el));

// --------------------
// MULTI LANGUAGE FR/EN
// --------------------
let currentLang = "fr";

const translations = {
  fr: {
    nav_home: "Accueil",
    nav_rooms: "Chambres",
    nav_services: "Services",
    nav_restaurant: "Restaurant",
    nav_gallery: "Galerie",
    nav_reviews: "Avis",
    nav_location: "Localisation",
    nav_booking: "Réservation",
    nav_contact: "Contact",

    hero_badge: "Hôtel 5 étoiles • Luxe & Prestige",
    hero_title: "Vivez l'expérience premium",
    hero_subtitle: "Chambres élégantes, service exceptionnel, restaurant gastronomique et spa.",
    hero_btn1: "Réserver maintenant",
    hero_btn2: "Découvrir les chambres",
    hero_stat1: "Note moyenne",
    hero_stat2: "Réception",
    hero_stat3: "Clients satisfaits",

    rooms_title: "Nos Chambres",
    rooms_subtitle: "Des chambres modernes et haut standing.",
    room1_title: "Chambre Deluxe",
    room1_desc: "WiFi • Climatisation • Vue mer • Petit déjeuner",
    room2_title: "Suite Royale",
    room2_desc: "Jacuzzi • Salon privé • Service VIP • Vue panoramique",
    room3_title: "Chambre Standard",
    room3_desc: "WiFi • TV écran plat • Climatisation • Confort",
    reserve_btn: "Réserver",

    services_title: "Services Premium",
    services_subtitle: "Tout pour un séjour exceptionnel.",
    serv1: "🏊 Piscine Luxe",
    serv1_desc: "Piscine premium avec espace VIP et bar.",
    serv2: "💆 Spa & Massage",
    serv2_desc: "Soins de relaxation et massages professionnels.",
    serv3: "🚗 Transport",
    serv3_desc: "Navette aéroport, chauffeur privé, véhicules luxe.",
    serv4: "🛡️ Sécurité",
    serv4_desc: "Sécurité 24/7, surveillance et accès sécurisé.",

    rest_title: "Restaurant & Menu",
    rest_subtitle: "Cuisine raffinée et expérience gastronomique.",
    rest_heading: "Restaurant HotelLux",
    rest_desc: "Plats africains, européens et menus VIP servis par des chefs professionnels.",
    rest_li1: "✔ Petit déjeuner buffet",
    rest_li2: "✔ Dîner romantique",
    rest_li3: "✔ Cocktails & bar lounge",

    gallery_title: "Galerie",
    gallery_subtitle: "Luxe, élégance et prestige.",

    reviews_title: "Avis Clients",
    reviews_subtitle: "Ils ont testé, ils ont adoré.",
    google_rating: "⭐ Note Google : 4.8 / 5",
    google_reviews: "Basé sur 428 avis",
    rev1: "“Service exceptionnel, chambre magnifique, très calme.”",
    rev2: "“Le meilleur hôtel que j’ai testé. Luxe pur.”",
    rev3: "“Restaurant excellent et personnel très professionnel.”",

    location_title: "Localisation",
    location_subtitle: "Facile d'accès depuis l'aéroport.",
    loc_address: "📍 Adresse",
    loc_dist1: "✈️ Aéroport : 15 minutes",
    loc_dist2: "🏙️ Centre-ville : 10 minutes",
    loc_dist3: "🚗 Transport disponible sur demande",

    booking_title: "Réservation",
    booking_subtitle: "Demandez la disponibilité en 30 secondes.",
    select_room: "Choisir une chambre",
    select_guests: "Nombre de personnes",
    send_whatsapp: "Envoyer sur WhatsApp",
    send_email: "Envoyer par Email",
    booking_fast: "⚡ Réservation rapide",
    booking_info: "Après l'envoi, notre équipe vous confirme la disponibilité et le prix final.",
    booking_support: "Support :",
    booking_secure: "Paiement :",
    booking_confirm: "Confirmation :",

    contact_title: "Contact",
    contact_subtitle: "Nous répondons rapidement.",
    contact_quick: "📞 Contact rapide",
    phone: "Téléphone :",
    hours: "Horaires :",
    support_title: "🛠 Support & Maintenance",
    support_desc: "Support gratuit 30 jours après livraison. Possibilité de maintenance mensuelle.",
    maintenance: "Maintenance :",

    ph_name: "Nom complet",
    ph_phone: "Téléphone",
    ph_msg: "Message (optionnel)"
  },

  en: {
    nav_home: "Home",
    nav_rooms: "Rooms",
    nav_services: "Services",
    nav_restaurant: "Restaurant",
    nav_gallery: "Gallery",
    nav_reviews: "Reviews",
    nav_location: "Location",
    nav_booking: "Booking",
    nav_contact: "Contact",

    hero_badge: "5-Star Hotel • Luxury & Prestige",
    hero_title: "Live the premium experience",
    hero_subtitle: "Elegant rooms, exceptional service, gourmet restaurant and spa.",
    hero_btn1: "Book now",
    hero_btn2: "Discover rooms",
    hero_stat1: "Average rating",
    hero_stat2: "Reception",
    hero_stat3: "Happy clients",

    rooms_title: "Our Rooms",
    rooms_subtitle: "Modern high-end rooms for your comfort.",
    room1_title: "Deluxe Room",
    room1_desc: "WiFi • Air conditioning • Sea view • Breakfast",
    room2_title: "Royal Suite",
    room2_desc: "Jacuzzi • Private lounge • VIP service • Panoramic view",
    room3_title: "Standard Room",
    room3_desc: "WiFi • Smart TV • Air conditioning • Comfort",
    reserve_btn: "Book",

    services_title: "Premium Services",
    services_subtitle: "Everything you need for a perfect stay.",
    serv1: "🏊 Luxury Pool",
    serv1_desc: "Premium pool with VIP area and bar.",
    serv2: "💆 Spa & Massage",
    serv2_desc: "Relaxing treatments and professional massages.",
    serv3: "🚗 Transport",
    serv3_desc: "Airport shuttle, private driver, luxury cars.",
    serv4: "🛡️ Security",
    serv4_desc: "24/7 security, surveillance and safe access.",

    rest_title: "Restaurant & Menu",
    rest_subtitle: "Fine cuisine and premium experience.",
    rest_heading: "HotelLux Restaurant",
    rest_desc: "African & international dishes served by professional chefs.",
    rest_li1: "✔ Buffet breakfast",
    rest_li2: "✔ Romantic dinner",
    rest_li3: "✔ Cocktails & lounge bar",

    gallery_title: "Gallery",
    gallery_subtitle: "Luxury, elegance and prestige.",

    reviews_title: "Customer Reviews",
    reviews_subtitle: "They tried it, they loved it.",
    google_rating: "⭐ Google Rating: 4.8 / 5",
    google_reviews: "Based on 428 reviews",
    rev1: "“Amazing service, beautiful room, very quiet.”",
    rev2: "“Best hotel I’ve ever stayed in. Pure luxury.”",
    rev3: "“Great restaurant and professional staff.”",

    location_title: "Location",
    location_subtitle: "Easy access from the airport.",
    loc_address: "📍 Address",
    loc_dist1: "✈️ Airport: 15 minutes",
    loc_dist2: "🏙️ City center: 10 minutes",
    loc_dist3: "🚗 Transport available on request",

    booking_title: "Booking",
    booking_subtitle: "Request availability in 30 seconds.",
    select_room: "Select a room",
    select_guests: "Number of guests",
    send_whatsapp: "Send via WhatsApp",
    send_email: "Send via Email",
    booking_fast: "⚡ Fast booking",
    booking_info: "After sending, our team will confirm availability and final price.",
    booking_support: "Support:",
    booking_secure: "Payment:",
    booking_confirm: "Confirmation:",

    contact_title: "Contact",
    contact_subtitle: "We respond quickly.",
    contact_quick: "📞 Quick contact",
    phone: "Phone:",
    hours: "Hours:",
    support_title: "🛠 Support & Maintenance",
    support_desc: "Free support for 30 days after delivery. Monthly maintenance available.",
    maintenance: "Maintenance:",

    ph_name: "Full name",
    ph_phone: "Phone number",
    ph_msg: "Message (optional)"
  }
};

function applyLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.innerText = translations[lang][key];
    }
  });

  // Placeholders
  document.querySelectorAll("[data-ph]").forEach(el => {
    const key = el.getAttribute("data-ph");
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  document.getElementById("langBtn").innerText = lang.toUpperCase();
}

document.getElementById("langBtn").addEventListener("click", () => {
  currentLang = currentLang === "fr" ? "en" : "fr";
  applyLanguage(currentLang);
});

applyLanguage("fr");

// --------------------
// BOOKING SYSTEM (WhatsApp + Email)
// --------------------
const bookingForm = document.getElementById("bookingForm");
const bookingMsg = document.getElementById("bookingMsg");
const sendEmailBtn = document.getElementById("sendEmailBtn");

// ⚠️ Mets ton numéro WhatsApp ici (format international sans +)
const WHATSAPP_NUMBER = "225000000000";

// ⚠️ Mets ton email ici
const HOTEL_EMAIL = "contact@hotellux.com";

function getBookingData() {
  return {
    name: document.getElementById("bName").value.trim(),
    phone: document.getElementById("bPhone").value.trim(),
    checkin: document.getElementById("bCheckin").value,
    checkout: document.getElementById("bCheckout").value,
    room: document.getElementById("bRoom").value,
    guests: document.getElementById("bGuests").value,
    message: document.getElementById("bMessage").value.trim()
  };
}

function validateDates(checkin, checkout) {
  if (!checkin || !checkout) return false;
  return new Date(checkout) > new Date(checkin);
}

bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = getBookingData();

  if (!validateDates(data.checkin, data.checkout)) {
    bookingMsg.innerText = "Erreur : la date de départ doit être après la date d'arrivée.";
    return;
  }

  const text =
`Bonjour HotelLux, je souhaite réserver :

👤 Nom: ${data.name}
📞 Téléphone: ${data.phone}
🏨 Chambre: ${data.room}
👥 Personnes: ${data.guests}
📅 Arrivée: ${data.checkin}
📅 Départ: ${data.checkout}

📝 Message: ${data.message || "Aucun"}`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");

  bookingMsg.innerText = "Votre demande a été envoyée sur WhatsApp ✔";
  bookingForm.reset();
});

sendEmailBtn.addEventListener("click", () => {
  const data = getBookingData();

  if (!data.name || !data.phone || !data.checkin || !data.checkout || !data.room || !data.guests) {
    bookingMsg.innerText = "Veuillez remplir tous les champs avant d'envoyer par email.";
    return;
  }

  if (!validateDates(data.checkin, data.checkout)) {
    bookingMsg.innerText = "Erreur : la date de départ doit être après la date d'arrivée.";
    return;
  }

  const subject = "Demande de réservation - HotelLux";
  const body =
`Bonjour,

Je souhaite réserver une chambre.

Nom: ${data.name}
Téléphone: ${data.phone}
Chambre: ${data.room}
Nombre de personnes: ${data.guests}
Arrivée: ${data.checkin}
Départ: ${data.checkout}

Message: ${data.message || "Aucun"}

Merci.`;

  window.location.href = `mailto:${HOTEL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
