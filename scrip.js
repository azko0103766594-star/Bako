const cars = [
{
name:"Bugatti Chiron",
price:"3 000 000€",
img:"https://images.unsplash.com/photo-1542362567-b07e54358753",
speed:"420 km/h",
engine:"W16 8.0L",
power:"1500 ch",
desc:"Hypercar ultra exclusive, performance extrême."
},
{
name:"Lamborghini Aventador",
price:"500 000€",
img:"https://images.unsplash.com/photo-1619767886558-efdc259cde1a",
speed:"350 km/h",
engine:"V12",
power:"770 ch",
desc:"Design agressif et moteur V12 atmosphérique."
},
{
name:"Ferrari SF90",
price:"600 000€",
img:"https://images.unsplash.com/photo-1541899481282-d53bffe3c35d",
speed:"340 km/h",
engine:"V8 Hybrid",
power:"1000 ch",
desc:"Technologie hybride de pointe Ferrari."
}
];

const grid = document.getElementById("carGrid");

cars.forEach((car)=>{
let card = document.createElement("div");
card.className = "card";

card.innerHTML = `
<img src="${car.img}">
<div class="card-body">
<h3>${car.name}</h3>
<div class="price">${car.price}</div>
</div>
`;

card.onclick = ()=>openModal(car);

grid.appendChild(card);
});

function openModal(car){
document.getElementById("modal").style.display="flex";

document.getElementById("modalContent").innerHTML = `
<h2 style="color:#d4af37">${car.name}</h2>
<img src="${car.img}" style="width:100%;border-radius:10px;margin:10px 0">
<p>${car.desc}</p>

<ul style="margin:10px 0;opacity:0.8">
<li>⚡ Vitesse : ${car.speed}</li>
<li>🔧 Moteur : ${car.engine}</li>
<li>🔥 Puissance : ${car.power}</li>
</ul>

<h3 style="color:#d4af37">${car.price}</h3>

<a href="https://wa.me/000000000" 
style="display:block;margin-top:15px;background:#25D366;color:#fff;text-align:center;padding:10px;border-radius:10px;text-decoration:none">
Réserver maintenant
</a>
`;
}

function closeModal(){
document.getElementById("modal").style.display="none";
}
