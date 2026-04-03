export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") return new Response("ok", { headers });

    // 🔵 GET POSTS
    if (path === "/posts" && request.method === "GET") {
      const keys = await env.DB.list(); // récupère toutes les clés KV
      const posts = [];
      for (let key of keys.keys) {
        const data = await env.DB.get(key.name, { type: "json" });
        posts.push(data);
      }
      // Trier par date si besoin
      posts.sort((a,b) => b.createdAt - a.createdAt);
      return new Response(JSON.stringify(posts), { headers });
    }

    // 🔵 CREATE POST
    if (path === "/posts" && request.method === "POST") {
      const data = await request.json();
      const id = "post_" + Date.now(); // id unique
      const postData = {
        id,
        title: data.title,
        image_url: data.image_url,
        likes: 0,
        views: 0,
        comments: [],
        createdAt: Date.now()
      };
      await env.DB.put(id, JSON.stringify(postData)); // stocker dans KV
      return new Response(JSON.stringify({ success:true, id }), { headers });
    }

    // 🔵 LIKE / VIEW / COMMENT
    if (path.startsWith("/posts/") && request.method === "POST") {
      const id = path.split("/")[2];
      const data = await request.json();
      const post = await env.DB.get(id, { type: "json" });
      if (!post) return new Response("Post not found", { status: 404 });

      if (data.action === "like") post.likes++;
      if (data.action === "view") post.views++;
      if (data.action === "comment") post.comments.push({ username: data.username, content: data.content });

      await env.DB.put(id, JSON.stringify(post));
      return new Response(JSON.stringify({ success:true }), { headers });
    }

    return new Response("Not found", { status:404 });
  }
};
