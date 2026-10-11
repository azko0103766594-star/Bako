/* spaces.js – Gestion des espaces avec Render et PostgreSQL */

async function renderHome() {
  if (!state.user) return;

  const avatar = document.getElementById("home-avatar");
  const name = document.getElementById("home-name");
  const codeEl = document.getElementById("home-code");
  const list = document.getElementById("spaces-list");
  const empty = document.getElementById("empty-spaces");

  avatar.src = state.user.avatar || defaultAvatar(state.user.firstname || "U");
  name.textContent = state.user.firstname || "Utilisateur";

  if (codeEl) {
    codeEl.textContent = "Mon code : " + (state.user.personalCode || "------");
  }

  list.innerHTML = "";
  empty.style.display = "none";

  try {
    const data = await listSpacesApi();
    state.spaces = data.spaces || [];

    if (state.spaces.length === 0) {
      empty.style.display = "block";
      return;
    }

    state.spaces.forEach((sp) => {
      const d = document.createElement("div");
      d.className = "space-card";

      const icon = document.createElement("div");
      icon.className = "space-icon";
      icon.textContent = initial(sp.name);

      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = sp.name;

      const info = document.createElement("p");
      info.textContent = "Code : " + (sp.code || "------");

      details.append(title, info);
      d.append(icon, details);
      d.onclick = () => openSpace(sp.id);

      list.appendChild(d);
    });
  } catch (error) {
    toast("Impossible de charger les espaces : " + error.message);
  }
}

async function createSpace() {
  if (!state.user || !state.user.ok) {
    toast("Crée ton profil d'abord");
    return;
  }

  const name = (document.getElementById("space-name").value || "").trim();
  const description = (document.getElementById("space-desc").value || "").trim();

  if (!name) {
    toast("Donne un nom à l'espace");
    return;
  }

  try {
    const sp = await createSpaceApi(name, description);

    await renderHome();

    document.getElementById("space-name").value = "";
    document.getElementById("space-desc").value = "";

    toast("Espace créé ! Code : " + sp.code);
    openSpace(sp.id);
  } catch (error) {
    toast("Erreur de création : " + error.message);
  }
}

async function joinSpace() {
  if (!state.user || !state.user.ok) {
    toast("Crée ton profil d'abord");
    return;
  }

  const code = (document.getElementById("join-code").value || "").trim();

  if (!/^\d{6}$/.test(code)) {
    toast("Entre un code valide de 6 chiffres");
    return;
  }

  try {
    const data = await joinSpaceApi(code);
    const sp = data.space;

    document.getElementById("join-code").value = "";

    await renderHome();

    toast("Tu as rejoint « " + sp.name + " »");
    openSpace(sp.id);
  } catch (error) {
    toast("Impossible de rejoindre : " + error.message);
  }
}

async function openSpace(id) {
  try {
    let sp = await api("/api/spaces/" + encodeURIComponent(id));
    state.currentSpaceId = id;
    state.currentThread = "general";

    // Garder la liste locale synchronisée avec le serveur.
    const index = state.spaces.findIndex((s) => s.id === id);
    if (index >= 0) state.spaces[index] = sp;
    else state.spaces.push(sp);

    document.getElementById("space-title").textContent = sp.name;
    document.getElementById("space-members-count").textContent =
      (sp.members ? sp.members.length : 0) +
      " membre" +
      (sp.members && sp.members.length > 1 ? "s" : "");

    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelector('.tab[data-tab="discussion"]').classList.add("active");

    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    document.getElementById("tab-discussion").classList.add("active");

    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    document.querySelector('.chip[data-thread="general"]').classList.add("active");

    renderInfos();
    renderDecisions();
    show("screen-space");

    // Charger les messages enregistrés sur le serveur.
    if (typeof loadSpaceMessages === "function") {
      await loadSpaceMessages(id);
    } else {
      renderMessages();
    }
  } catch (error) {
    toast("Impossible d'ouvrir l'espace : " + error.message);
  }
}

function getMemberAvatar(authorName) {
  if (!state.currentSpaceId || !authorName) {
    return state.user && state.user.avatar ? state.user.avatar : "";
  }

  const sp = state.spaces.find((s) => s.id === state.currentSpaceId);
  if (!sp || !sp.members) return "";

  const member = sp.members.find(
    (m) => m.firstname === authorName || m.username === authorName
  );

  return member && member.avatar
    ? member.avatar
    : state.user && state.user.firstname === authorName
      ? state.user.avatar
      : "";
}
