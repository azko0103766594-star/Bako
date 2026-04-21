const cars = [
{
brand:"Bugatti",
name:"Chiron",
price:3000000,
img:"https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200",
speed:"420 km/h",
engine:"W16 8.0L",
power:"1500 ch"
},
{
brand:"Bugatti",
name:"Bolide",
price:4000000,
img:"https://images.unsplash.com/photo-1617531652008-3d8f8c0f4c34?w=1200",
speed:"500 km/h",
engine:"W16",
power:"1850 ch"
},
{
brand:"Ferrari",
name:"SF90 Stradale",
price:600000,
img:"https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200",
speed:"340 km/h",
engine:"V8 Hybrid",
power:"1000 ch"
},
{
brand:"Ferrari",
name:"LaFerrari",
price:2500000,
img:"https://images.unsplash.com/photo-1511910849309-0dffb8788f0d?w=1200",
speed:"350 km/h",
engine:"V12 Hybrid",
power:"950 ch"
},
{
brand:"Lamborghini",
name:"Aventador SVJ",
price:500000,
img:"https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200",
speed:"350 km/h",
engine:"V12",
power:"770 ch"
},
{
brand:"Lamborghini",
name:"Huracan STO",
price:300000,
img:"https://images.unsplash.com/photo-1600703136783-bdb5ea3655b2?w=1200",
speed:"310 km/h",
engine:"V10",
power:"640 ch"
},
{
brand:"Rolls Royce",
name:"Phantom",
price:450000,
img:"https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=1200",
speed:"250 km/h",
engine:"V12",
power:"563 ch"
},
{
brand:"McLaren",
name:"720S",
price:300000,
img:"https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=1200",
speed:"341 km/h",
engine:"V8 Twin Turbo",
power:"710 ch"
}
];

// 👉 AUTO GENERATION DES 50 VOITURES (AVEC IMAGES FIABLES)
const brands = ["Bugatti","Ferrari","Lamborghini","Rolls Royce","McLaren"];
const models = {
Bugatti:["Chiron","Divo","Bolide"],
Ferrari:["Roma","SF90","812 Superfast"],
Lamborghini:["Revuelto","Urus","Huracan STO"],
"Rolls Royce":["Ghost","Cullinan","Phantom"],
McLaren:["P1","Senna","Artura"]
};

for(let i=0;i<42;i++){
let brand = brands[i%brands.length];
let name = models[brand][i%3];

cars.push({
brand,
name,
price: Math.floor(Math.random()*3000000)+200000,
img:`https://source.unsplash.com/1200x800/?${brand}-car-supercar-${i}`,
speed:(300+Math.floor(Math.random()*200))+" km/h",
engine:"Engine Premium",
power:(500+Math.floor(Math.random()*1000))+" ch"
});
}

let grid = document.getElementById("grid");

function show(data){
grid.innerHTML="";

data.forEach(car=>{
let div=document.createElement("div");
div.className="card";

div.innerHTML=`
<img src="${car.img}" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200'">
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

// FILTER (inchangé)
document.getElementById("search").oninput=filter;
document.getElementById("brand").onchange=filter;
document.getElementById("price").onchange=filter;

function filter(){
let s=document.getElementById("search").value.toLowerCase();
let b=document.getElementById("brand").value;
let p=document.getElementById("price").value;

let result=cars.filter(c=>{
return (
(c.name.toLowerCase().includes(s)) &&
(b==="all"||c.brand===b) &&
(
p==="all"||
(p==="low"&&c.price<500000)||
(p==="mid"&&c.price<=2000000&&c.price>=500000)||
(p==="high"&&c.price>2000000)
)
);
});

show(result);
}

// MODAL (inchangé)
function openModal(car){
document.getElementById("modal").style.display="flex";

document.getElementById("modalContent").innerHTML=`
<h2 style="color:#d4af37">${car.brand} ${car.name}</h2>
<img src="${car.img}" style="width:100%;border-radius:10px;margin:10px 0">

<ul>
<li>⚡ ${car.speed}</li>
<li>🔧 ${car.engine}</li>
<li>🔥 ${car.power}</li>
</ul>

<h3 style="color:#d4af37">${car.price.toLocaleString()}€</h3>

<a href="https://wa.me/000000000?text=Je%20veux%20la%20${car.brand}%20${car.name}"
style="display:block;margin-top:15px;background:#25D366;color:#fff;text-align:center;padding:10px;border-radius:10px;text-decoration:none">
Réserver
</a>
`;
}

function closeModal(){
document.getElementById("modal").style.display="none";
}
