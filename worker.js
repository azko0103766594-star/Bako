export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // ✅ CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ✅ UPLOAD IMAGE
    if (request.method === "POST") {
      try {

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
          return new Response("No file", { status: 400 });
        }

        const fileName = `${Date.now()}-${file.name}`;

        // 🪣 upload dans ton bucket bako-bako
        await env.BUCKET.put(fileName, file.stream(), {
          httpMetadata: {
            contentType: file.type
          }
        });

        // 🔥 TON URL (comme tu voulais)
        const publicUrl = `https://debb6192ab34a20e599bf2d0ab956e6e.r2.cloudflarestorage.com/bako-bako/${fileName}`;

        return Response.json({
          success: true,
          url: publicUrl
        }, {
          headers: corsHeaders
        });

      } catch (err) {
        return new Response("Erreur: " + err.message, {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response("Worker OK 🚀", {
      headers: corsHeaders
    });
  }
};
