const cars = [
  {
    title: "Lamborghini Aventador",
    price: "450 000€",
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753"
  },
  {
    title: "Ferrari 488 GTB",
    price: "320 000€",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70"
  },
  {
    title: "Rolls Royce Phantom",
    price: "520 000€",
    img: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16"
  },
  {
    title: "Bugatti Chiron",
    price: "3 000 000€",
    img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6"
  }
];

function openModal(i){
  document.getElementById("modal").style.display = "flex";
  document.getElementById("modalImg").src = cars[i].img;
  document.getElementById("modalTitle").innerText = cars[i].title;
  document.getElementById("modalPrice").innerText = cars[i].price;
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
}

function contact(){
  window.open("https://wa.me/225000000000","_blank");
}

function scrollToCars(){
  document.getElementById("cars").scrollIntoView({behavior:"smooth"});
}
