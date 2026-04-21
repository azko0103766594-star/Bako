const cars = [
{
name:"Bugatti Chiron",
price:"3 000 000€",
img:"https://images.unsplash.com/photo-1542362567-b07e54358753",
speed:"420 km/h",
engine:"W16 8.0L",
power:"1500 ch",
desc:"Hypercar ultra rare et extrêmement puissante."
},

{
name:"Rolls Royce Phantom",
price:"450 000€",
img:"https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9",
speed:"250 km/h",
engine:"V12",
power:"563 ch",
desc:"Le luxe absolu et le confort royal."
},

{
name:"Lamborghini Aventador",
price:"500 000€",
img:"https://images.unsplash.com/photo-1617531653332-bd46c24f2068",
speed:"350 km/h",
engine:"V12",
power:"770 ch",
desc:"Design agressif et performance extrême."
},

{
name:"Ferrari SF90",
price:"600 000€",
img:"https://images.unsplash.com/photo-1583121274602-3e2820c69888",
speed:"340 km/h",
engine:"V8 Hybrid",
power:"1000 ch",
desc:"Technologie hybride Ferrari nouvelle génération."
},

{
name:"McLaren 720S",
price:"300 000€",
img:"https://images.unsplash.com/photo-1614200187524-dc4b892acf16",
speed:"341 km/h",
engine:"V8 Twin Turbo",
power:"710 ch",
desc:"Supercar légère et ultra rapide."
},

{
name:"Pagani Huayra",
price:"2 500 000€",
img:"https://images.unsplash.com/photo-1620288627223-53302f4e8c74",
speed:"370 km/h",
engine:"V12 AMG",
power:"730 ch",
desc:"Art et performance réunis."
},

{
name:"Koenigsegg Jesko",
price:"3 200 000€",
img:"https://images.unsplash.com/photo-1617531652008-3d8f8c0f4c34",
speed:"480 km/h",
engine:"V8 Twin Turbo",
power:"1600 ch",
desc:"Une des voitures les plus rapides du monde."
},

{
name:"Aston Martin Valkyrie",
price:"2 800 000€",
img:"https://images.unsplash.com/photo-1620891549027-942fdc95d3f6",
speed:"400 km/h",
engine:"V12 Hybrid",
power:"1155 ch",
desc:"F1 de route exceptionnelle."
}
];

const grid = document.getElementById("carGrid");

cars.forEach(car=>{
let div = document.createElement("div");
div.className="card";

div.innerHTML=`
<img src="${car.img}">
<div class="card-body">
<h3>${car.name}</h3>
<div class="price">${car.price}</div>
</div>
`;

div.onclick=()=>openModal(car);
grid.appendChild(div);
});

function openModal(car){
document.getElementById("modal").style.display="flex";

document.getElementById("modalContent").innerHTML=`
<h2 style="color:#d4af37">${car.name}</h2>
<img src="${car.img}" style="width:100%;border-radius:10px;margin:10px 0">

<p>${car.desc}</p>

<ul style="margin-top:10px;opacity:0.8">
<li>⚡ Vitesse : ${car.speed}</li>
<li>🔧 Moteur : ${car.engine}</li>
<li>🔥 Puissance : ${car.power}</li>
</ul>

<h3 style="color:#d4af37;margin-top:10px">${car.price}</h3>

<a href="https://wa.me/000000000"
style="display:block;margin-top:15px;background:#25D366;color:#fff;text-align:center;padding:10px;border-radius:10px;text-decoration:none">
Réserver sur WhatsApp
</a>
`;
}

function closeModal(){
document.getElementById("modal").style.display="none";
}
