/**
 * Optional API Key Authentication Middleware
 *
 * If API_KEY is defined in .env, validates the 'x-api-key' header.
 * If API_KEY is NOT defined in .env, allows all requests (development mode).
 */

function apiKeyAuth(req, res, next) {
  const configuredApiKey = process.env.API_KEY;

  // If no API key is configured in .env, skip enforcement
  if (!configuredApiKey || configuredApiKey.trim() === '') {
    return next();
  }

  // Check header or query parameter
  const clientKey = req.headers['x-api-key'] || req.query.api_key;

  if (!clientKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing x-api-key header',
    });
  }

  if (clientKey !== configuredApiKey) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid API key',
    });
  }

  next();
}

/**
 * Checks if API authentication is currently enforced
 */
function isAuthEnforced() {
  return Boolean(process.env.API_KEY && process.env.API_KEY.trim() !== '');
}

module.exports = {
  apiKeyAuth,
  isAuthEnforced,
};

