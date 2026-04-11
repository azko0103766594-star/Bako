export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // =========================
    // 🧪 TEST
    // =========================
    if (url.pathname === "/") {
      return new Response("INSTAGRAM READY 🚀");
    }

    // =========================
    // 📥 UPLOAD IMAGE → R2
    // =========================
    if (url.pathname === "/upload" && method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return Response.json({ error: "No file" }, { status: 400 });
      }

      const fileName = Date.now() + "-" + file.name;

      await env.BUCKET.put(fileName, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
      });

      // ⚠️ IMPORTANT: ton URL R2 publique
      const imageUrl = `https://pub-fb69105f2e6b47f28bda893593284762.r2.dev/${fileName}`;

      return Response.json({ url: imageUrl });
    }

    // =========================
    // 📦 GET POSTS
    // =========================
    if (url.pathname === "/posts" && method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM posts ORDER BY id DESC"
      ).all();

      return Response.json(results);
    }

    // =========================
    // ➕ CREATE POST
    // =========================
    if (url.pathname === "/posts" && method === "POST") {
      const { url: imageUrl } = await request.json();

      await env.DB.prepare(
        "INSERT INTO posts (url, likes, comments, created_at) VALUES (?, ?, ?, ?)"
      )
        .bind(imageUrl, "[]", "[]", new Date().toISOString())
        .run();

      return Response.json({ success: true });
    }

    // =========================
    // ❤️ LIKE
    // =========================
    if (url.pathname === "/like" && method === "POST") {
      const { id, userId } = await request.json();

      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      let likes = JSON.parse(post.likes || "[]");

      if (likes.includes(userId)) {
        likes = likes.filter(u => u !== userId);
      } else {
        likes.push(userId);
      }

      await env.DB.prepare(
        "UPDATE posts SET likes = ? WHERE id = ?"
      ).bind(JSON.stringify(likes), id).run();

      return Response.json({ success: true, likes });
    }

    // =========================
    // 💬 COMMENT
    // =========================
    if (url.pathname === "/comment" && method === "POST") {
      const { id, text } = await request.json();

      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      let comments = JSON.parse(post.comments || "[]");

      comments.push(text);

      await env.DB.prepare(
        "UPDATE posts SET comments = ? WHERE id = ?"
      ).bind(JSON.stringify(comments), id).run();

      return Response.json({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  }
};
