const cars = [
{brand:"Bugatti",name:"Chiron",price:3000000,img:"https://images.unsplash.com/photo-1542362567-b07e54358753",speed:"420 km/h",engine:"W16",power:"1500 ch"},
{brand:"Ferrari",name:"SF90",price:600000,img:"https://images.unsplash.com/photo-1583121274602-3e2820c69888",speed:"340 km/h",engine:"V8 Hybrid",power:"1000 ch"},
{brand:"Lamborghini",name:"Aventador",price:500000,img:"https://images.unsplash.com/photo-1617531653332-bd46c24f2068",speed:"350 km/h",engine:"V12",power:"770 ch"},
{brand:"Rolls Royce",name:"Phantom",price:450000,img:"https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9",speed:"250 km/h",engine:"V12",power:"563 ch"},
{brand:"Bugatti",name:"Bolide",price:4000000,img:"https://images.unsplash.com/photo-1617531652008-3d8f8c0f4c34",speed:"500 km/h",engine:"W16",power:"1850 ch"}
];

let grid = document.getElementById("carGrid");

function display(data){
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

display(cars);

/* FILTERS */
document.getElementById("search").addEventListener("input",filter);
document.getElementById("filterBrand").addEventListener("change",filter);
document.getElementById("filterPrice").addEventListener("change",filter);

function filter(){
let search=document.getElementById("search").value.toLowerCase();
let brand=document.getElementById("filterBrand").value;
let price=document.getElementById("filterPrice").value;

let result=cars.filter(c=>{
let matchSearch=c.name.toLowerCase().includes(search);
let matchBrand=brand==="all"||c.brand===brand;

let matchPrice=
price==="all"||
(price==="low"&&c.price<500000)||
(price==="mid"&&c.price>=500000&&c.price<=2000000)||
(price==="high"&&c.price>2000000);

return matchSearch&&matchBrand&&matchPrice;
});

display(result);
}

/* MODAL */
function openModal(car){
document.getElementById("modal").style.display="flex";

document.getElementById("modalContent").innerHTML=`
<h2 style="color:#d4af37">${car.brand} ${car.name}</h2>
<img src="${car.img}" style="width:100%;border-radius:10px;margin:10px 0">

<ul>
<li>⚡ Vitesse : ${car.speed}</li>
<li>🔧 Moteur : ${car.engine}</li>
<li>🔥 Puissance : ${car.power}</li>
</ul>

<h3 style="color:#d4af37;margin-top:10px">${car.price.toLocaleString()}€</h3>

<a href="https://wa.me/000000000"
style="display:block;margin-top:15px;background:#25D366;color:#fff;text-align:center;padding:10px;border-radius:10px;text-decoration:none">
Réserver
</a>
`;
}

function closeModal(){
document.getElementById("modal").style.display="none";
}
