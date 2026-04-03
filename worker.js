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
      const list = await env.DB.list();
      const posts = [];
      for (const key of list.keys) {
        const data = await env.DB.get(key.name, { type: "json" });
        if(data) posts.push(data);
      }
      posts.sort((a,b) => b.createdAt - a.createdAt);
      return new Response(JSON.stringify(posts), { headers });
    }

    // 🔵 CREATE POST
    if (path === "/posts" && request.method === "POST") {
      try {
        const data = await request.json();
        if (!data.image_url) return new Response("No image", { status: 400 });

        const id = "post_" + Date.now();
        const postData = {
          id,
          title: data.title || "Nouvelle image",
          image_url: data.image_url,
          likes: 0,
          views: 0,
          comments: [],
          createdAt: Date.now()
        };
        await env.DB.put(id, JSON.stringify(postData));
        return new Response(JSON.stringify({ success:true, id }), { headers });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { headers, status: 500 });
      }
    }

    // 🔵 LIKE / VIEW / COMMENT
    if (path.startsWith("/posts/") && request.method === "POST") {
      const id = path.split("/")[2];
      const post = await env.DB.get(id, { type: "json" });
      if(!post) return new Response("Post not found", { status: 404 });

      const data = await request.json();
      if(data.action === "like") post.likes++;
      if(data.action === "view") post.views++;
      if(data.action === "comment") post.comments.push({ username: data.username, content: data.content });

      await env.DB.put(id, JSON.stringify(post));
      return new Response(JSON.stringify({ success:true }), { headers });
    }

    return new Response("Not found", { status: 404 });
  }
};