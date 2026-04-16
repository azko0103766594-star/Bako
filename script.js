let score = 0;
let time = 10;
let timer = null;
let playing = false;

let best = localStorage.getItem("bestClick") || 0;
document.getElementById("best").textContent = best;

function startGame() {
  if (playing) return;

  playing = true;
  score = 0;
  time = 10;

  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = time;

  timer = setInterval(() => {
    time--;
    document.getElementById("time").textContent = time;

    if (time === 0) {
      clearInterval(timer);
      playing = false;

      if (score > best) {
        best = score;
        localStorage.setItem("bestClick", best);
        document.getElementById("best").textContent = best;
      }

      alert("Temps terminé ! Score : " + score);
    }
  }, 1000);
}

function addClick() {
  if (!playing) return;
  score++;
  document.getElementById("score").textContent = score;
}

function resetGame() {
  clearInterval(timer);
  playing = false;
  score = 0;
  time = 10;

  document.getElementById("score").textContent = 0;
  document.getElementById("time").textContent = 10;
}
