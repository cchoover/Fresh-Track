export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const zipCode = url.searchParams.get('zipCode');
  const token = url.searchParams.get('token');

  try {
    const response = await fetch(
      `https://api.kroger.com/v1/locations?filter.zipCode.near=${zipCode}&filter.limit=5&filter.radiusInMiles=10`,
      {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Location search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
