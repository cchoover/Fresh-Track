export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const term = url.searchParams.get('term');
  const locationId = url.searchParams.get('locationId');
  const token = url.searchParams.get('token');

  try {
    let apiUrl = `https://api.kroger.com/v1/products?filter.term=${term}&filter.limit=12`;
    if (locationId) apiUrl += `&filter.locationId=${locationId}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Product search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
