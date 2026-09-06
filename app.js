/* =========================================================
   TEXT PRO — APPLICATION
========================================================= */


/* =========================================================
   1. SÉLECTEURS
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const input = $("#inputText");
const formatArea = $("#formatText");


/* =========================================================
   2. VARIABLES
========================================================= */

let currentText =
  localStorage.getItem("textpro_draft") || "";

let deferredInstallPrompt = null;


/* =========================================================
   3. STATISTIQUES
========================================================= */

function stats(text) {

  const chars = [...text].length;

  const words =
    text.trim()
      ? text.trim().split(/\s+/).length
      : 0;

  const lines =
    text
      ? text.split(/\r?\n/).length
      : 0;

  return {
    chars,
    words,
    lines
  };
}


function updateStats() {

  const s = stats(input.value);

  $("#liveStats").textContent =
    `${s.chars} caractères · ${s.words} mots · ${s.lines} lignes`;

  const enabled =
    localStorage.getItem("textpro_stats") !== "false";

  $("#liveStats").style.display =
    enabled ? "" : "none";
}


/* =========================================================
   4. NOTIFICATIONS
========================================================= */

function toast(message) {

  const el = $("#toast");

  el.textContent = message;

  el.classList.add("show");

  clearTimeout(window.__toast);

  window.__toast = setTimeout(() => {

    el.classList.remove("show");

  }, 2200);
}


/* =========================================================
   5. NAVIGATION
========================================================= */

function go(view) {

  $$(".view").forEach((section) => {
    section.classList.remove("active");
  });

  const target =
    $("#view-" + view) ||
    $("#view-home");

  target.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (view === "history") {
    renderHistory();
  }

  if (view === "share") {
    updateSharePreview();
  }
}


/* =========================================================
   6. TEXTE PRINCIPAL
========================================================= */

function getText() {

  return input.value.trimEnd();

}


function saveDraft() {

  localStorage.setItem(
    "textpro_draft",
    input.value
  );

}


/* =========================================================
   7. NETTOYAGE DU TEXTE
========================================================= */

function cleanText(text, options = {}) {

  let out =
    text.replace(/\r\n?/g, "\n");


  // Caractères invisibles
  if (options.invisible !== false) {

    out = out.replace(
      /[\u200B-\u200D\uFEFF\u00AD]/g,
      ""
    );

  }


  // Emojis
  if (options.emoji) {

    out = out.replace(
      /[\p{Extended_Pictographic}\uFE0F]/gu,
      ""
    );

  }


  // Caractères spéciaux
  if (options.special) {

    out = out.replace(
      /[^\p{L}\p{N}\s.,!?;:'"()\-_%€$@/]/gu,
      ""
    );

  }


  // Espaces
  if (options.spaces !== false) {

    out = out
      .split("\n")
      .map(line =>
        line
          .replace(/[ \t]+/g, " ")
          .trim()
      )
      .join("\n");

  }


  // Lignes vides
  if (options.blank !== false) {

    out = out
      .split("\n")
      .filter((line, index, array) => {

        return (
          line.trim() !== "" ||
          (
            index > 0 &&
            array[index - 1].trim() !== ""
          )
        );

      })
      .join("\n");

  }


  // Doublons
  if (options.dupes !== false) {

    const seen = new Set();

    out = out
      .split("\n")
      .filter(line => {

        const key =
          line.trim().toLowerCase();

        if (!key) {
          return true;
        }

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;

      })
      .join("\n");

  }


  return out.trim();

}


/* =========================================================
   8. HISTORIQUE
========================================================= */

function saveHistory(text) {

  if (!text.trim()) {
    return;
  }

  let history =
    JSON.parse(
      localStorage.getItem("textpro_history") || "[]"
    );

  history.unshift({

    text,

    time:
      new Date().toLocaleString(
        "fr-FR",
        {
          dateStyle: "short",
          timeStyle: "short"
        }
      )

  });

  history =
    history.slice(0, 30);

  localStorage.setItem(
    "textpro_history",
    JSON.stringify(history)
  );

}


function renderHistory() {

  const list = $("#historyList");

  const history =
    JSON.parse(
      localStorage.getItem("textpro_history") || "[]"
    );


  if (!history.length) {

    list.innerHTML = `
      <div class="about-box">

        <b>Aucun texte enregistré</b>

        <p>
          Ton historique apparaîtra ici après
          une transformation ou un nettoyage.
        </p>

      </div>
    `;

    return;
  }


  list.innerHTML = history
    .map((item, index) => {

      return `

        <article class="history-item">

          <div class="history-meta">
            ${item.time}
          </div>

          <p>
            ${escapeHTML(item.text)}
          </p>

          <div class="history-actions">

            <button data-hcopy="${index}">
              📋 Copier
            </button>

            <button data-huse="${index}">
              Utiliser
            </button>

            <button data-hdel="${index}">
              🗑️
            </button>

          </div>

        </article>

      `;

    })
    .join("");


  $$("[data-hcopy]").forEach(button => {

    button.onclick = () => {

      copyText(
        history[
          +button.dataset.hcopy
        ].text
      );

    };

  });


  $$("[data-huse]").forEach(button => {

    button.onclick = () => {

      input.value =
        history[
          +button.dataset.huse
        ].text;

      saveDraft();

      updateStats();

      go("home");

    };

  });


  $$("[data-hdel]").forEach(button => {

    button.onclick = () => {

      history.splice(
        +button.dataset.hdel,
        1
      );

      localStorage.setItem(
        "textpro_history",
        JSON.stringify(history)
      );

      renderHistory();

    };

  });

}


function escapeHTML(text) {

  return text.replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );

}


/* =========================================================
   9. COPIER
========================================================= */

function copyText(text) {

  if (!text) {

    toast("Aucun texte à copier.");

    return;
  }


  navigator.clipboard
    ?.writeText(text)

    .then(() => {

      toast("Texte copié ✓");

    })

    .catch(() => {

      const textarea =
        document.createElement("textarea");

      textarea.value = text;

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand("copy");

      textarea.remove();

      toast("Texte copié ✓");

    });

}


/* =========================================================
   10. INITIALISATION
========================================================= */

input.value = currentText;

updateStats();


/* =========================================================
   11. ÉDITEUR PRINCIPAL
========================================================= */

input.addEventListener(
  "input",
  () => {

    updateStats();

    saveDraft();

    updateSharePreview();

  }
);


/* Effacer */

$("#clearInput").onclick = () => {

  input.value = "";

  saveDraft();

  updateStats();

  toast("Texte effacé.");

};


/* Coller */

$("#pasteBtn").onclick =
  async () => {

    try {

      input.value =
        await navigator.clipboard.readText();

      saveDraft();

      updateStats();

      updateSharePreview();

      toast("Texte collé ✓");

    } catch {

      toast(
        "Autorise l'accès au presse-papiers ou colle manuellement."
      );

    }

  };


/* Auto nettoyer */

$("#autoClean").onclick = () => {

  if (!getText()) {

    toast("Colle d'abord un texte.");

    return;
  }


  const before =
    getText();

  const after =
    cleanText(
      before,
      {
        spaces: true,
        blank: true,
        dupes: true,
        invisible: true
      }
    );


  input.value = after;

  saveDraft();

  updateStats();

  saveHistory(after);


  toast(
    before === after
      ? "Ton texte est déjà propre ✨"
      : "Texte nettoyé ✓"
  );

};


/* =========================================================
   12. NAVIGATION DES PAGES
========================================================= */

$$("[data-view]").forEach(button => {

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      go(button.dataset.view);

    }
  );

});


/* =========================================================
   13. THÈME
========================================================= */

$("#themeBtn").onclick = () => {

  const dark =
    document.body.classList.toggle("dark");

  localStorage.setItem(
    "textpro_dark",
    dark
  );

  $("#darkToggle").checked =
    dark;

};


$("#darkToggle").onchange = event => {

  const dark =
    event.target.checked;

  document.body.classList.toggle(
    "dark",
    dark
  );

  localStorage.setItem(
    "textpro_dark",
    dark
  );

};


if (
  localStorage.getItem("textpro_dark")
  === "true"
) {

  document.body.classList.add("dark");

  $("#darkToggle").checked = true;

}


/* =========================================================
   14. STATISTIQUES
========================================================= */

$("#statsToggle").onchange =
  event => {

    localStorage.setItem(
      "textpro_stats",
      event.target.checked
    );

    $("#liveStats").style.display =
      event.target.checked
        ? ""
        : "none";

  };


if (
  localStorage.getItem("textpro_stats")
  === "false"
) {

  $("#statsToggle").checked = false;

  $("#liveStats").style.display =
    "none";

}


/* =========================================================
   15. OUTIL NETTOYER
========================================================= */

$("#cleanBtn").onclick = () => {

  if (!getText()) {

    toast("Colle d'abord un texte.");

    return;
  }


  const before =
    getText();


  const after =
    cleanText(
      before,
      {

        spaces:
          $("#optSpaces").checked,

        blank:
          $("#optBlank").checked,

        dupes:
          $("#optDupes").checked,

        invisible:
          $("#optInvisible").checked,

        emoji:
          $("#optEmoji").checked,

        special:
          $("#optSpecial").checked

      }
    );


  input.value = after;

  saveDraft();

  updateStats();

  saveHistory(after);


  const beforeStats =
    stats(before);

  const afterStats =
    stats(after);


  $("#cleanResult")
    .classList
    .remove("hidden");


  $("#cleanResult").innerHTML = `

    <h3>
      ✅ Texte nettoyé
    </h3>

    <div class="stats">

      ${
        beforeStats.chars -
        afterStats.chars > 0

        ? `
          <span>
            ${
              beforeStats.chars -
              afterStats.chars
            }
            caractères retirés
          </span>
        `

        : ""
      }

      <span>
        ${
          Math.max(
            0,
            beforeStats.lines -
            afterStats.lines
          )
        }
        lignes retirées
      </span>

    </div>

    <div class="result-text"></div>

    <div class="action-row">

      <button
        class="primary-btn"
        id="copyClean"
      >
        📋 Copier
      </button>

      <button
        class="secondary-btn"
        id="undoClean"
      >
        ↩️ Annuler
      </button>

    </div>

  `;


  $(".result-text").textContent =
    after;


  $("#copyClean").onclick =
    () => copyText(after);


  $("#undoClean").onclick =
    () => {

      input.value = before;

      saveDraft();

      updateStats();

      $("#cleanResult")
        .classList
        .add("hidden");

    };

};


/* =========================================================
   16. OUTIL AMÉLIORER
========================================================= */

$$("[data-improve]").forEach(button => {

  button.onclick = () => {

    if (!getText()) {

      toast("Colle d'abord un texte.");

      return;
    }


    let text =
      getText();

    const mode =
      button.dataset.improve;


    /* Raccourcir */

    if (mode === "short") {

      text =
        text
          .split(/(?<=[.!?])\s+/)
          .map(sentence =>

            sentence.length > 120

              ? sentence
                  .slice(0, 117)
                  .trim() + "…"

              : sentence

          )
          .join(" ");

    }


    /* Professionnel */

    if (mode === "professional") {

      text =
        cleanText(
          text,
          {
            spaces: true,
            blank: true,
            dupes: true,
            invisible: true
          }
        )
        .replace(
          /\b(slt|salut)\b/gi,
          "Bonjour"
        )
        .replace(
          /\bmerciii+\b/gi,
          "Merci"
        );

    }


    /* Simple */

    if (mode === "simple") {

      text =
        cleanText(
          text,
          {
            spaces: true,
            blank: true,
            dupes: true,
            invisible: true
          }
        )
        .replace(
          /\bafin de\b/gi,
          "pour"
        )
        .replace(
          /\bcependant\b/gi,
          "mais"
        );

    }


    /* Annonce */

    if (mode === "announcement") {

      text =
        "📢 " +
        text.replace(
          /\n+/g,
          "\n\n"
        );

    }


    /* Liste */

    if (mode === "list") {

      text =
        text
          .split("\n")
          .filter(Boolean)
          .map(
            (line, index) =>
              `${index + 1}. ${line}`
          )
          .join("\n");

    }


    /* Structurer */

    if (mode === "paragraph") {

      text =
        cleanText(
          text,
          {
            spaces: true,
            blank: true,
            dupes: false,
            invisible: true
          }
        )
        .replace(
          /([.!?])\s+/g,
          "$1\n\n"
        );

    }


    $("#improveResult")
      .classList
      .remove("hidden");


    $("#improveResult").innerHTML = `

      <h3>
        ✨ Résultat
      </h3>

      <div class="result-text"></div>

      <div class="action-row">

        <button
          class="primary-btn"
          id="useImprove"
        >
          Utiliser
        </button>

        <button
          class="secondary-btn"
          id="copyImprove"
        >
          📋 Copier
        </button>

      </div>

    `;


    $("#improveResult .result-text")
      .textContent = text;


    $("#useImprove").onclick = () => {

      input.value = text;

      saveDraft();

      updateStats();

      go("home");

    };


    $("#copyImprove").onclick =
      () => copyText(text);


    saveHistory(text);

  };

});


/* =========================================================
   17. OUTIL FORMATER
========================================================= */

function applyFormat(type) {

  let text =
    formatArea.value ||
    getText();


  if (!text) {

    toast("Colle d'abord un texte.");

    return;
  }


  if (type === "bold") {

    text = `*${text}*`;

  }


  if (type === "italic") {

    text = `_${text}_`;

  }


  if (type === "strike") {

    text = `~${text}~`;

  }


  if (type === "bullets") {

    text =
      text
        .split("\n")
        .filter(Boolean)
        .map(line => "• " + line)
        .join("\n");

  }


  if (type === "number") {

    text =
      text
        .split("\n")
        .filter(Boolean)
        .map(
          (line, index) =>
            `${index + 1}. ${line}`
        )
        .join("\n");

  }


  if (type === "quote") {

    text =
      text
        .split("\n")
        .map(line => "> " + line)
        .join("\n");

  }


  formatArea.value =
    text;

}


$$("[data-format]").forEach(button => {

  button.onclick = () => {

    applyFormat(
      button.dataset.format
    );

  };

});


/* Transformations */

$$("[data-transform]").forEach(button => {

  button.onclick = () => {

    let text =
      formatArea.value ||
      getText();


    if (!text) {

      toast("Colle d'abord un texte.");

      return;
    }


    const type =
      button.dataset.transform;


    if (type === "upper") {

      text =
        text.toUpperCase();

    }


    if (type === "lower") {

      text =
        text.toLowerCase();

    }


    if (type === "title") {

      text =
        text
          .toLowerCase()
          .replace(
            /(^|[.!?]\s+)([a-zà-ÿ])/g,
            (match, start, letter) =>
              start +
              letter.toUpperCase()
          );

    }


    if (type === "single") {

      text =
        text
          .replace(
            /\s*\n+\s*/g,
            " "
          )
          .replace(
            /[ \t]+/g,
            " "
          )
          .trim();

    }


    formatArea.value =
      text;

  };

});


/* Copier */

$("#formatCopy").onclick =
  () => {

    copyText(
      formatArea.value
    );

  };


/* Enregistrer */

$("#formatSave").onclick =
  () => {

    if (!formatArea.value) {
      return;
    }


    input.value =
      formatArea.value;

    saveDraft();

    saveHistory(
      formatArea.value
    );

    updateStats();

    toast(
      "Texte enregistré ✓"
    );

  };


/* =========================================================
/* =========================================================
   18. PARTAGE
========================================================= */

function updateSharePreview() {

  const text =
    getText();

  $("#sharePreview").textContent =
    text ||
    "Ton texte apparaîtra ici.";

  $("#shareStats").textContent =
    `${stats(text).chars} caractères`;
}


$$("[data-platform]").forEach(button => {

  button.onclick = () => {

    const text =
      getText();

    if (!text) {

      toast(
        "Colle d'abord un texte."
      );

      return;
    }

    const platform =
      button.dataset.platform;

    saveHistory(text);


    /* =========================
       WHATSAPP
    ========================= */

    if (platform === "whatsapp") {

      window.location.href =
        "https://wa.me/?text=" +
        encodeURIComponent(text);

      return;
    }


    /* =========================
       FACEBOOK
    ========================= */

    if (platform === "facebook") {

      window.open(

        "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(location.href) +
        "&quote=" +
        encodeURIComponent(text),

        "_blank",
        "noopener"

      );

      return;
    }


    /* =========================
       INSTAGRAM
    ========================= */

    if (platform === "instagram") {

      copyText(text);

      setTimeout(() => {

        window.open(
          "https://www.instagram.com/",
          "_blank"
        );

      }, 500);

      toast(
        "Légende copiée ✓ Ouvre Instagram"
      );

      return;
    }


    /* =========================
       TELEGRAM
    ========================= */

    if (platform === "telegram") {

      window.open(

        "https://t.me/share/url?url=" +
        encodeURIComponent(location.href) +
        "&text=" +
        encodeURIComponent(text),

        "_blank",
        "noopener"

      );

      return;
    }


    /* =========================
       SMS
    ========================= */

    if (platform === "sms") {

      window.location.href =
        "sms:?body=" +
        encodeURIComponent(text);

      return;
    }


    /* =========================
       TWITTER / X
    ========================= */

    if (platform === "twitter") {

      window.open(

        "https://x.com/intent/post?text=" +
        encodeURIComponent(text),

        "_blank",
        "noopener"

      );

      return;
    }


    /* =========================
       AUTRES
    ========================= */

    if (platform === "other") {

      if (navigator.share) {

        navigator
          .share({
            title: "TEXT PRO",
            text: text
          })
          .catch(() => {});

      } else {

        copyText(text);

      }

      return;
    }

  };

});


/* =========================================================
   19. HISTORIQUE — SUPPRESSION
========================================================= */

$("#clearHistory").onclick =
  () => {

    if (
      confirm(
        "Effacer tout l'historique ?"
      )
    ) {

      localStorage.removeItem(
        "textpro_history"
      );

      renderHistory();

      toast(
        "Historique effacé."
      );

    }

  };


/* =========================================================
   20. ANNÉE
========================================================= */

$("#year").textContent =
  new Date().getFullYear();


/* =========================================================
   21. INSTALLATION DE TEXT PRO
========================================================= */

const installBtn =
  $("#installAppBtn");


/*
   Le navigateur indique que
   l'application peut être installée.
*/

window.addEventListener(
  "beforeinstallprompt",
  (event) => {

    event.preventDefault();

    deferredInstallPrompt =
      event;

  }
);


/*
   Bouton Installer
*/

installBtn.onclick =
  async () => {

    /*
       Le navigateur ne propose pas
       l'installation automatique.
    */

    if (!deferredInstallPrompt) {

      toast(
        "Pour installer TEXT PRO, ouvre le menu ⋮ du navigateur puis choisis « Installer l'application »."
      );

      return;

    }


    /*
       Afficher la fenêtre officielle
       d'installation Android / navigateur.
    */

    deferredInstallPrompt.prompt();


    const result =
      await deferredInstallPrompt
        .userChoice;


    if (
      result.outcome === "accepted"
    ) {

      toast(
        "Installation de TEXT PRO lancée ✓"
      );

    } else {

      toast(
        "Installation annulée."
      );

    }


    deferredInstallPrompt =
      null;

  };


/*
   L'événement arrive uniquement
   lorsque l'application a réellement
   été installée.
*/

window.addEventListener(
  "appinstalled",
  () => {

    toast(
      "TEXT PRO est maintenant installé ✓"
    );

  }
);


/* =========================================================
   FIN TEXT PRO
========================================================= */
