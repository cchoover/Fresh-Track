export default async function handler(req, res) {
    const { term, locationId, token } = req.query
  
    try {
      let url = `https://api.kroger.com/v1/products?filter.term=${term}&filter.limit=12`
      if (locationId) {
        url += `&filter.locationId=${locationId}`
      }
  
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      })
  
      const data = await response.json()
      res.status(200).json(data)
    } catch (error) {
      res.status(500).json({ error: 'Product search failed' })
    }
  }