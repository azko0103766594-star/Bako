// ========================================
// FORMATION DÉBUTANT
// JavaScript principal
// ========================================


// Année automatique du footer

const yearElement =
    document.getElementById("year");

if (yearElement) {
    yearElement.textContent =
        new Date().getFullYear();
}



// ========================================
// MENU MOBILE
// ========================================

const menuBtn =
    document.getElementById("menuBtn");

const mainNav =
    document.getElementById("mainNav");


if (menuBtn && mainNav) {

    menuBtn.addEventListener("click", function () {

        const isOpen =
            mainNav.classList.toggle("active");

        menuBtn.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

    });


    // Fermer le menu après un clic

    const navLinks =
        mainNav.querySelectorAll("a");


    navLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            mainNav.classList.remove("active");

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });

}



// ========================================
// ANALYTICS VERCEL
// ========================================

function trackEvent(name, data = {}) {

    if (typeof window.va === "function") {

        window.va("event", {
            name: name,
            data: data
        });

    }

}



// ========================================
// SUIVI DES BOUTONS
// ========================================

document
    .querySelectorAll(".btn")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                trackEvent(
                    "navigation_click",
                    {
                        button:
                            button.textContent.trim()
                    }
                );

            }
        );

    });



// ========================================
// SUIVI DES WIDGETS CHARIOW
// ========================================

// On détecte les clics à l'intérieur
// des zones Chariow.

document
    .querySelectorAll(".chariow-wrapper")
    .forEach(function (wrapper, index) {

        wrapper.addEventListener(
            "click",
            function () {

                trackEvent(
                    "formation_click",
                    {
                        formation:
                            index + 1
                    }
                );

            }
        );

    });



// ========================================
// CONSOLE
// ========================================

console.log(
    "Formation Débutant — site chargé."
);