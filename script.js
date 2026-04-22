const dishes = [
  {
    name: "Filet de Bœuf Royal",
    desc: "Bœuf premium grillé, sauce truffe noire, purée maison.",
    img: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
  },
  {
    name: "Homard Grillée Luxe",
    desc: "Homard frais avec beurre citronné et herbes fines.",
    img: "https://images.unsplash.com/photo-1553621042-f6e147245754"
  },
  {
    name: "Risotto aux Champignons",
    desc: "Riz crémeux aux cèpes et parmesan affiné.",
    img: "https://images.unsplash.com/photo-1604908177522-040b0d0f8d5a"
  },
  {
    name: "Saumon Norvégien",
    desc: "Saumon grillé avec légumes croquants.",
    img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288"
  },
  {
    name: "Pâtes Truffe Noire",
    desc: "Tagliatelles fraîches à la crème de truffe.",
    img: "https://images.unsplash.com/photo-1525755662778-989d0524087e"
  },
  {
    name: "Poulet Gourmet",
    desc: "Poulet rôti aux épices fines et sauce maison.",
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1"
  },
  {
    name: "Pizza Italienne Luxe",
    desc: "Pizza artisanale mozzarella di bufala.",
    img: "https://images.unsplash.com/photo-1548365328-9f547f7d0e0b"
  },
  {
    name: "Salade César Premium",
    desc: "Salade fraîche avec poulet croustillant.",
    img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9"
  },
  {
    name: "Dessert Chocolat Fondant",
    desc: "Cœur coulant chocolat noir intense.",
    img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c"
  },
  {
    name: "Tiramisu Maison",
    desc: "Recette italienne authentique crémeuse.",
    img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9"
  }
];

const container = document.getElementById("menuContainer");

container.classList.add("menu");

dishes.forEach(d => {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <img src="${d.img}" />
    <div class="card-content">
      <h3>${d.name}</h3>
      <p>${d.desc}</p>
      <a class="btn-res"
        href="https://wa.me/225000000000?text=Je%20veux%20réserver%20:${d.name}">
        Réserver
      </a>
    </div>
  `;

  container.appendChild(card);
});
