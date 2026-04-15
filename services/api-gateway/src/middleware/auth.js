/**
 * Gateway JWT Authentication Middleware
 * 
 * Performs stateless JWT validation using purely mathematical verification
 * without establishing synchronous gRPC calls to the Auth Service per request.
 * Additionally verifies against the shared Redis blacklist database.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');

const config = require('../config/env');
const { redisClient } = require('../config/redis');

// Match the prefix used by Auth Service
const BLACKLIST_PREFIX = 'blacklist:';

// List of exact routes that do not require JWT authorization 
const PUBLIC_ROUTES = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/gateway/status',
];

// List of route prefixes that do not require JWT authorization (e.g. Swagger)
const PUBLIC_PREFIXES = [
  '/api-docs',
];

async function authMiddleware(req, res, next) {
  try {
    // 1. Skip validation for defined public routes (Task 3.8)
    if (PUBLIC_ROUTES.includes(req.path)) {
      return next();
    }
    
    // Check path prefixes
    if (PUBLIC_PREFIXES.some(prefix => req.path.startsWith(prefix))) {
      return next();
    }

    // 2. Extract Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or malformed Authorization header', 401, 'MISSING_TOKEN');
    }
    const token = authHeader.substring(7);

    // 3. Check Redis Blacklist (Task 3.6)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const isBlacklisted = await redisClient.get(`${BLACKLIST_PREFIX}${tokenHash}`);
    if (isBlacklisted !== null) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    }

    // 4. Stateless JWT Verification (Task 3.5)
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: 'whatsapp-clone-auth',
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Access token has expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
    }

    // 5. Attach decoded data to request and custom headers (Task 3.7)
    req.user = decoded;
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-username'] = decoded.username;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
