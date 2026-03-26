export default async function handler(req, res) {
    const clientId = process.env.KROGER_CLIENT_ID
    const clientSecret = process.env.KROGER_CLIENT_SECRET
    const credentials = Buffer.from(clientId + ':' + clientSecret).toString('base64')
  
    const { code, redirect_uri } = req.query
  
    let body, grantType
  
    if (code) {
      grantType = 'authorization_code'
      body = `grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`
    } else {
      grantType = 'client_credentials'
      body = 'grant_type=client_credentials&scope=product.compact'
    }
  
    try {
      const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + credentials
        },
        body: body
      })
  
      const data = await response.json()
      res.status(200).json(data)
    } catch (error) {
      res.status(500).json({ error: 'Token request failed' })
    }
  }