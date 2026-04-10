export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // test
    if (request.method === "GET") {
      return new Response("Worker OK 🚀", { headers: corsHeaders });
    }

    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
          return new Response("No file", { status: 400, headers: corsHeaders });
        }

        const fileName = `${Date.now()}-${file.name}`;

        // 📦 upload R2
        await env.BUCKET.put(fileName, file.stream(), {
          httpMetadata: {
            contentType: file.type || "image/jpeg"
          }
        });

        // 🔥 URL CORRECTE R2 (S3 PUBLIC STYLE)
        const url = `https://debb6192ab34a20e599bf2d0ab956e6e.r2.cloudflarestorage.com/bako-bako/${fileName}`;

        return Response.json({
          success: true,
          url
        }, { headers: corsHeaders });

      } catch (err) {
        return new Response("Error: " + err.message, {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
};
