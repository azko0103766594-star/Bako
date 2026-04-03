export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB;

    // Autoriser Vercel à appeler ton API
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
      const { results } = await db.prepare(
        "SELECT * FROM posts ORDER BY created_at DESC"
      ).all();
      return new Response(JSON.stringify(results), { headers });
    }

    // 🔵 CREATE POST
    if (path === "/posts" && request.method === "POST") {
      const data = await request.json();

      const result = await db.prepare(
        "INSERT INTO posts (title, image_url) VALUES (?, ?)"
      ).bind(data.title, data.image_url).run();

      return new Response(JSON.stringify({ success:true, id: result.lastRowId }), { headers });
    }

    // 🔵 LIKE / VIEW / COMMENT
    if (path.startsWith("/posts/") && request.method === "POST") {
      const id = path.split("/")[2];
      const data = await request.json();

      // LIKE
      if (data.action === "like") {
        await db.prepare(
          "UPDATE posts SET likes = likes + 1 WHERE id=?"
        ).bind(id).run();
        return new Response(JSON.stringify({ success:true }), { headers });
      }

      // VIEW
      if (data.action === "view") {
        await db.prepare(
          "UPDATE posts SET views = views + 1 WHERE id=?"
        ).bind(id).run();
        return new Response(JSON.stringify({ success:true }), { headers });
      }

      // COMMENT
      if (data.action === "comment") {
        await db.prepare(
          "INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)"
        ).bind(id, data.username, data.content).run();

        return new Response(JSON.stringify({ success:true }), { headers });
      }
    }

    // 🔵 GET COMMENTS
    if (path.startsWith("/comments/") && request.method === "GET") {
      const postId = path.split("/")[2];

      const { results } = await db.prepare(
        "SELECT * FROM comments WHERE post_id=? ORDER BY created_at ASC"
      ).bind(postId).all();

      return new Response(JSON.stringify(results), { headers });
    }

    return new Response("Not found", { status:404 });
  }
};