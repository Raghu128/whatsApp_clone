/**
 * Auth Service — JWT Authentication Middleware
 * 
 * Validates access tokens on protected routes.
 * Used for the /me endpoint and any future protected auth routes.
 */

const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const tokenService = require('../services/token.service');

/**
 * Express middleware to authenticate requests using JWT.
 * Extracts token from Authorization header, verifies it,
 * checks Redis blacklist, and attaches userId to request.
 */
async function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    }

    // Verify and decode the token
    const decoded = tokenService.verifyAccessToken(token);

    // Attach user info to request
    req.userId = decoded.userId;
    req.username = decoded.username;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
