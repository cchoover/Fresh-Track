export default async function handler(req, res) {
    const { zipCode, token } = req.query
  
    try {
      const response = await fetch(
        `https://api.kroger.com/v1/locations?filter.zipCode.near=${zipCode}&filter.limit=5&filter.radiusInMiles=10`,
        {
          headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
          }
        }
      )
  
      const data = await response.json()
      res.status(200).json(data)
    } catch (error) {
      res.status(500).json({ error: 'Location search failed' })
    }
  }