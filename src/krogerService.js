const KROGER_CLIENT_ID = 'freshtrack-bbcdq7cc'
const REDIRECT_URI = 'https://fresh-track-theta.vercel.app/callback'

export function getKrogerLoginUrl() {
  return `https://api.kroger.com/v1/connect/oauth2/authorize?scope=profile.compact&client_id=${KROGER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`
}

export async function getClientToken() {
  const response = await fetch('/api/kroger-token')
  const data = await response.json()
  return data.access_token
}

export async function exchangeCodeForToken(code) {
  const response = await fetch(
    `/api/kroger-token?code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
  )
  const data = await response.json()
  return data.access_token
}

export async function searchProducts(term, token, locationId) {
  let url = `/api/kroger-products?term=${encodeURIComponent(term)}&token=${token}`
  if (locationId) {
    url += `&locationId=${locationId}`
  }
  const response = await fetch(url)
  const data = await response.json()
  return data.data || []
}

export async function findStores(zipCode, token) {
  const response = await fetch(
    `/api/kroger-locations?zipCode=${zipCode}&token=${token}`
  )
  const data = await response.json()
  return data.data || []
}
