export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "GET") {
      return new Response("Worker R2 OK 🚀", {
        headers: corsHeaders
      });
    }

    if (request.method === "POST") {
      try {

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
          return new Response("Aucun fichier", {
            status: 400,
            headers: corsHeaders
          });
        }

        const fileName = `${Date.now()}-${file.name}`;

        await env.BUCKET.put(fileName, file.stream(), {
          httpMetadata: {
            contentType: file.type
          }
        });

        // 🔥 TON URL R2 ICI
        const baseUrl = "https://b27281e14a41df00e65c1d85ff1bba90.r2.cloudflarestorage.com/aboubacar-bucket";

        const url = `${baseUrl}/${fileName}`;

        return Response.json({
          success: true,
          url: url,
          fileName: fileName
        }, {
          headers: corsHeaders
        });

      } catch (err) {
        return new Response("Erreur upload: " + err.message, {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
};