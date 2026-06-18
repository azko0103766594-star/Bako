console.log("wheel.js chargé");

// ======================
// SPIN WHEEL
// ======================

function spinWheel() {

    soundSpin.play();

    console.log("spinWheel() lancé");

    spinning = true;

    const extra =
        Math.random() * Math.PI * 2;

    const target =
        angle +
        (Math.PI * 2 * 8) +
        extra;

    const startAngle = angle;

    const duration = 3000;
    const startTime = performance.now();

    function animate(time) {

        let progress =
            (time - startTime) / duration;

        if (progress > 1) {
            progress = 1;
        }

        const ease =
            1 - Math.pow(1 - progress, 3);

        angle =
            startAngle +
            (target - startAngle) * ease;

        if (progress < 1) {

            requestAnimationFrame(
                animate
            );

        } else {

            spinning = false;

            console.log(
                "Roulette terminée"
            );

            calculateReward();
        }
    }

    requestAnimationFrame(
        animate
    );
}

// ======================
// RECOMPENSE
// ======================

function calculateReward() {

    console.log(
        "calculateReward()"
    );

    const segment =
        (Math.PI * 2) /
        rewards.length;

    let a =
        angle % (Math.PI * 2);

    const index =
        Math.floor(a / segment);

    const reward =
        rewards[index];

    console.log(
        "Reward obtenu :",
        reward
    );

    applyReward(reward);
}

// ======================
// EFFETS
// ======================

function applyReward(type) {

    console.log(
        "applyReward :",
        type
    );

    const p =
        players[currentPlayer];

    switch (type) {

        case "treasure":
            p.coins += 5;
            break;

        case "bomb":
            p.coins -= 5;
            break;

        case "turbo":
            p.coins += 2;
            break;

        case "gift":
            p.coins +=
                Math.floor(
                    Math.random() * 10
                ) + 1;
            break;

        case "jackpot":
            p.coins += 15;
            break;

        case "thief":

            let target =
                Math.floor(
                    Math.random() *
                    players.length
                );

            while (
                target === currentPlayer
            ) {

                target =
                    Math.floor(
                        Math.random() *
                        players.length
                    );
            }

            players[target].coins -= 5;
            p.coins += 5;

            break;

        case "web":
            p.skip = true;
            break;
    }

    // ======================
    // TOUR UTILISÉ
    // ======================

    p.turns--;

    console.log(
        "Joueur",
        currentPlayer + 1,
        "tours restants :",
        p.turns
    );

    console.log(
        "Etat joueurs :",
        players
    );

    nextPlayer();
}
function spinWheel() {

    soundSpin.play();

    console.log("spinWheel() lancé");
