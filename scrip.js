const brands = [
"Bugatti","Ferrari","Lamborghini","Rolls Royce","McLaren"
];

const models = {
Bugatti:["Chiron","Bolide","Divo"],
Ferrari:["SF90","LaFerrari","812 Superfast","Roma"],
Lamborghini:["Aventador","Revuelto","Huracan STO","Urus"],
"Rolls Royce":["Phantom","Cullinan","Ghost","Spectre"],
McLaren:["720S","P1","Senna","Artura"]
};

// 🚀 50 voitures auto générées
let cars = [];

for(let i=0;i<50;i++){
let brand = brands[i % brands.length];
let modelList = models[brand];
let name = modelList[i % modelList.length];

let price = Math.floor(Math.random()*3500000)+200000;

cars.push({
brand,
name,
price,
img:`https://source.unsplash.com/800x600/?${brand},car,luxury&sig=${i}`,
speed:(300+Math.floor(Math.random()*200))+" km/h",
engine:["V8","V10","V12","Hybrid","W16"][i%5],
power:(500+Math.floor(Math.random()*1200))+" ch"
});
}

let grid = document.getElementById("grid");

function show(data){
grid.innerHTML="";

data.forEach(car=>{
let div=document.createElement("div");
div.className="card";

div.innerHTML=`
<img src="${car.img}">
<div class="card-body">
<h3>${car.brand} ${car.name}</h3>
<div class="price">${car.price.toLocaleString()}€</div>
</div>
`;

div.onclick=()=>openModal(car);
grid.appendChild(div);
});
}

show(cars);

// FILTER
document.getElementById("search").oninput=filter;
document.getElementById("brand").onchange=filter;
document.getElementById("price").onchange=filter;

function filter(){
let s=document.getElementById("search").value.toLowerCase();
let b=document.getElementById("brand").value;
let p=document.getElementById("price").value;

let result=cars.filter(c=>{
let okSearch=c.name.toLowerCase().includes(s);
let okBrand=b==="all"||c.brand===b;

let okPrice=
p==="all"||
(p==="low"&&c.price<500000)||
(p==="mid"&&c.price>=500000&&c.price<=2000000)||
(p==="high"&&c.price>2000000);

return okSearch&&okBrand&&okPrice;
});

show(result);
}

// MODAL
function openModal(car){
document.getElementById("modal").style.display="flex";

document.getElementById("modalContent").innerHTML=`
<h2 style="color:#d4af37">${car.brand} ${car.name}</h2>
<img src="${car.img}" style="width:100%;border-radius:10px;margin:10px 0">

<ul style="opacity:0.8">
<li>⚡ Vitesse : ${car.speed}</li>
<li>🔧 Moteur : ${car.engine}</li>
<li>🔥 Puissance : ${car.power}</li>
</ul>

<h3 style="color:#d4af37">${car.price.toLocaleString()}€</h3>

<a href="https://wa.me/000000000?text=Je%20veux%20la%20${car.brand}%20${car.name}"
style="display:block;margin-top:15px;background:#25D366;color:#fff;text-align:center;padding:10px;border-radius:10px;text-decoration:none">
Réserver cette voiture
</a>
`;
}

function closeModal(){
document.getElementById("modal").style.display="none";
}
