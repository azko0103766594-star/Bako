export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Headers pour autoriser le front-end
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response("ok", { headers });
    }

    // 🔵 GET POSTS
    if (path === "/posts" && request.method === "GET") {
      const keys = await env.DB.list(); // lister toutes les clés
      const posts = [];
      for (let key of keys.keys) {
        const value = await env.DB.get(key.name);
        posts.push(JSON.parse(value));
      }
      posts.sort((a, b) => b.created_at - a.created_at); // plus récent en premier
      return new Response(JSON.stringify(posts), { headers });
    }

    // 🔵 CREATE POST
    if (path === "/posts" && request.method === "POST") {
      const data = await request.json();
      const id = "post_" + Date.now();

      const postData = {
        id,
        title: data.title || "Nouvelle image",
        image_url: data.image_url,
        likes: 0,
        views: 0,
        comments: [],
        created_at: Date.now()
      };

      await env.DB.put(id, JSON.stringify(postData));

      return new Response(JSON.stringify({ success: true, id }), { headers });
    }

    // 🔵 LIKE / VIEW / COMMENT
    if (path.startsWith("/posts/") && request.method === "POST") {
      const id = path.split("/")[2];
      const postStr = await env.DB.get(id);
      if (!postStr) return new Response(JSON.stringify({ success: false, error: "Post introuvable" }), { headers });

      const post = JSON.parse(postStr);
      const data = await request.json();

      if (data.action === "like") post.likes++;
      if (data.action === "view") post.views++;
      if (data.action === "comment") {
        post.comments.push({ username: data.username, content: data.content });
      }

      await env.DB.put(id, JSON.stringify(post));
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response("Not found", { status: 404 });
  }
};
