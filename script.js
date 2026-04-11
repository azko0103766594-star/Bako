export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // 🌍 CORS
    // =========================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // =========================
    // 🧪 TEST
    // =========================
    if (url.pathname === "/") {
      return new Response("INSTAGRAM API READY 🚀", { headers: corsHeaders });
    }

    // =========================
    // 📥 GET POSTS (D1)
    // =========================
    if (url.pathname === "/posts") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM posts ORDER BY createdAt DESC"
      ).all();

      const posts = results.map(p => ({
        id: p.id,
        url: p.url,
        likes: JSON.parse(p.likes || "[]"),
        comments: JSON.parse(p.comments || "[]"),
        createdAt: p.createdAt
      }));

      return Response.json(posts, { headers: corsHeaders });
    }

    // =========================
    // 📤 UPLOAD IMAGE (R2 + D1)
    // =========================
    if (url.pathname === "/upload" && request.method === "POST") {
      const form = await request.formData();
      const file = form.get("image");

      if (!file) {
        return new Response("No image", { status: 400 });
      }

      const id = Date.now().toString();
      const fileName = `${id}.jpg`;

      // 📦 upload R2
      await env.BUCKET.put(fileName, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      const imageUrl = `${env.PUBLIC_URL}/${fileName}`;

      // 🗄️ save D1
      await env.DB.prepare(
        "INSERT INTO posts (id, url, likes, comments, createdAt) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(id, imageUrl, "[]", "[]", Date.now())
        .run();

      return Response.json({
        id,
        url: imageUrl,
        likes: [],
        comments: []
      }, { headers: corsHeaders });
    }

    // =========================
    // ❤️ LIKE / DISLIKE
    // =========================
    if (url.pathname === "/like" && request.method === "POST") {
      const { postId, userId } = await request.json();

      const { results } = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(postId).all();

      const post = results[0];
      if (!post) return new Response("Not found", { status: 404 });

      let likes = JSON.parse(post.likes || "[]");

      if (likes.includes(userId)) {
        likes = likes.filter(u => u !== userId);
      } else {
        likes.push(userId);
      }

      await env.DB.prepare(
        "UPDATE posts SET likes = ? WHERE id = ?"
      ).bind(JSON.stringify(likes), postId).run();

      return Response.json({ success: true }, { headers: corsHeaders });
    }

    // =========================
    // 💬 COMMENTAIRES
    // =========================
    if (url.pathname === "/comment" && request.method === "POST") {
      const { postId, text } = await request.json();

      const { results } = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(postId).all();

      const post = results[0];
      if (!post) return new Response("Not found", { status: 404 });

      let comments = JSON.parse(post.comments || "[]");
      comments.push(text);

      await env.DB.prepare(
        "UPDATE posts SET comments = ? WHERE id = ?"
      ).bind(JSON.stringify(comments), postId).run();

      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};
