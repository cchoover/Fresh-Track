export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const redirect_uri = url.searchParams.get('redirect_uri');

  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;
  const credentials = btoa(clientId + ':' + clientSecret);

  let body;
  if (code) {
    body = `grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`;
  } else {
    body = 'grant_type=client_credentials&scope=product.compact';
  }

  try {
    const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + credentials
      },
      body: body
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Token request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}