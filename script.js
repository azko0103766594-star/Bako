/* ========================================
   FORMATION DÉBUTANT
   JavaScript principal
======================================== */


/* ========================================
   ANNÉE DU FOOTER
======================================== */

const year =
    document.getElementById("year");

if (year) {
    year.textContent =
        new Date().getFullYear();
}



/* ========================================
   MENU MOBILE
======================================== */

const menuBtn =
    document.getElementById("menuBtn");

const mainNav =
    document.getElementById("mainNav");


if (menuBtn && mainNav) {

    menuBtn.addEventListener(
        "click",
        function () {

            const opened =
                mainNav.classList.toggle("active");

            menuBtn.setAttribute(
                "aria-expanded",
                opened ? "true" : "false"
            );

        }
    );


    mainNav
        .querySelectorAll("a")
        .forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    mainNav.classList.remove(
                        "active"
                    );

                    menuBtn.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        });

}



/* ========================================
   VERCEL ANALYTICS
======================================== */

function trackEvent(
    eventName,
    eventData = {}
) {

    if (
        typeof window.va === "function"
    ) {

        window.va(
            "event",
            {
                name: eventName,
                data: eventData
            }
        );

    }

}



/* ========================================
   SUIVI DES BOUTONS
======================================== */

document
    .querySelectorAll("[data-track]")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                trackEvent(
                    "button_click",
                    {
                        button:
                            button.dataset.track
                    }
                );

            }
        );

    });



/* ========================================
   SUIVI DES 4 FORMATIONS
======================================== */

const formationWidgets =
    document.querySelectorAll(
        '[id^="chariow-widget-"]'
    );


formationWidgets.forEach(
    function (widget, index) {

        widget.addEventListener(
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

    }
);



/* ========================================
   MESSAGE CONSOLE
======================================== */

console.log(
    "Formation Débutant — site chargé."
);
