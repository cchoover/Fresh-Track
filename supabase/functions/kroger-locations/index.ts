const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const zipCode = url.searchParams.get("zipCode");
  const token = url.searchParams.get("token");

  const response = await fetch(
    `https://api.kroger.com/v1/locations?filter.zipCode.near=${zipCode}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});