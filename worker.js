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

    if (request.method === "POST") {
      try {

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
          return new Response("No file", { status: 400, headers: corsHeaders });
        }

        const fileName = `${Date.now()}-${file.name}`;

        await env.BUCKET.put(fileName, file.stream(), {
          httpMetadata: {
            contentType: file.type
          }
        });

        return Response.json({
          url: `https://debb6192ab34a20e599bf2d0ab956e6e.r2.cloudflarestorage.com/bako-bako/${fileName}`
        }, {
          headers: corsHeaders
        });

      } catch (err) {
        return new Response("ERROR: " + err.message, {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response("OK");
  }
};
