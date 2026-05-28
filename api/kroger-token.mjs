export default function handler(req, res) {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;
  const credentials = Buffer.from(clientId + ':' + clientSecret).toString('base64');

  const code = req.query.code;
  const redirect_uri = req.query.redirect_uri;

  let body;
  if (code) {
    body = 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + redirect_uri;
  } else {
    body = 'grant_type=client_credentials&scope=product.compact';
  }

  fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials
    },
    body: body
  })
    .then(r => r.json())
    .then(data => res.status(200).json(data))
    .catch(() => res.status(500).json({ error: 'Token request failed' }));
}