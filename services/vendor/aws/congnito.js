const jwt = require('../../libs/jwt')

fetchPublicKeys.cache = {}
async function fetchPublicKeys({ issuer, kid }) {
  if (fetchPublicKeys.cache[kid]) {
    return fetchPublicKeys.cache[kid]
  }

  // Reset the keys when we have a cache miss, to avoid memory leaks.
  fetchPublicKeys.cache = {}
  const response = await fetch(`${issuer}/.well-known/jwks.json`)
  const keys = (await response.json()).keys

  fetchPublicKeys.cache[kid] = keys
  return keys
}

async function isValidToken(token) {
    try {
      await validateToken(token)
      return true
    } catch (e) {
      return false
    }
  }

  async function validateToken(token) {
    try {
      if (!token) {
        throw new Error('No token')
      }
      // Parse header and body
      const [header, body] = jwt.decodedHeaderAndBody(token)
  
      // Get public cognito keys for pool.
      const cognitoKeys = await fetchPublicKeys({
        kid: header.kid,
        issuer: body.iss,
      })
  
      // AWS Cognito provides their public keys in JWK format.  The "jsonwebtoken"
      // module we use to verify tokens requires public keys to be in PEM format.
      // Hence we also need the "jwk-to-pem" module to do that conversion.
      const key = cognitoKeys.find(k => k.kid === header.kid)
      if (!key) {
        throw new Error('No matching Cognito Key')
      }
  
      // Verify and decode the token.
      const verifiedToken = jwt.verifiedBody({ token, key, maxAge: body.exp })
      //const verifiedToken = jwt.verifiedBody({ token, key})
  
      if (!verifiedToken) {
        throw new Error('Invalid Token')
      }
  
      return verifiedToken
    } catch (e) {
      console.log(e, 'ERROR token')
      throw e
    }
  }

  module.exports = {
    isValidToken
  }