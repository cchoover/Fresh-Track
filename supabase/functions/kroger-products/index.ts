const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const term = url.searchParams.get("term");
  const token = url.searchParams.get("token");
  const locationId = url.searchParams.get("locationId");

  let apiUrl = `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(term || "")}`;
  if (locationId) apiUrl += `&filter.locationId=${locationId}`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});