console.log("APP START");

document.addEventListener("DOMContentLoaded", () => {

  const feed = document.getElementById("feed");
  const upload = document.getElementById("upload");
  const publishBtn = document.getElementById("publishBtn");

  let posts = [];
  const userId = "user1";

  // 🔹 Bouton publier
  publishBtn.addEventListener("click", () => {
    upload.value = "";
    upload.click();
  });

  // 🔹 Upload image
  upload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileName = Date.now() + "_" + file.name;

      // Upload vers Supabase
      const { error: uploadError } = await supabaseClient.storage
        .from("Abk2")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Récupérer URL publique
      const { data } = supabaseClient.storage
        .from("Abk2")
        .getPublicUrl(fileName);

      const url = data.publicUrl;

      // Enregistrer en base
      const { error: insertError } = await supabaseClient
        .from("posts")
        .insert([{
          url: url,
          likes: [],
          comments: []
        }]);

      if (insertError) throw insertError;

      fetchPosts();

    } catch (err) {
      console.error(err);
      alert("Erreur upload: " + err.message);
    }
  });

  // 🔹 Récupérer posts
  async function fetchPosts() {
    const { data, error } = await supabaseClient
      .from("posts")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erreur fetch: " + error.message);
      return;
    }

    posts = data || [];
    renderFeed();
  }

  // 🔹 Affichage
  function renderFeed() {
    feed.innerHTML = "";

    if (!posts.length) {
      feed.innerHTML = "<p>Aucune image</p>";
      return;
    }

    posts.forEach(p => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <img src="${p.url}" width="150"><br><br>
        ❤️ ${p.likes?.length || 0}<br><br>
        <button onclick="likePost('${p.id}')">Like</button>
      `;

      feed.appendChild(div);
    });
  }

  // 🔹 Like
  window.likePost = async (id) => {
    const p = posts.find(x => x.id == id);
    if (!p) return;

    if (!p.likes) p.likes = [];

    if (p.likes.includes(userId)) {
      p.likes = p.likes.filter(x => x !== userId);
    } else {
      p.likes.push(userId);
    }

    const { error } = await supabaseClient
      .from("posts")
      .update({ likes: p.likes })
      .eq("id", id);

    if (error) {
      alert("Erreur like");
      return;
    }

    fetchPosts();
  };

  // 🔹 Initial
  fetchPosts();

});
