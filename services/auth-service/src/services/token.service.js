/**
 * Token Service
 * 
 * Handles JWT access/refresh token creation, verification,
 * refresh token rotation, and Redis blacklist for revocation.
 * 
 * Tasks: 2.5, 2.6, 2.7, 2.9, 2.10
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const logger = require('@whatsapp-clone/shared/utils/logger');

const config = require('../config/env');
const { redisClient } = require('../config/redis');
const { RefreshToken } = require('../models');

const log = logger.child({ service: 'auth-service', component: 'token-service' });

// ── Constants ──
const BLACKLIST_PREFIX = 'blacklist:';

class TokenService {
  /**
   * Generate a JWT access token.
   * 
   * @param {object} payload - { userId, username }
   * @returns {string} Signed JWT access token
   */
  generateAccessToken(payload) {
    return jwt.sign(
      {
        userId: payload.userId,
        username: payload.username,
        type: 'access',
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_ACCESS_EXPIRY,
        issuer: 'whatsapp-clone-auth',
        subject: payload.userId,
      }
    );
  }

  /**
   * Generate a refresh token (random 64-byte hex string).
   * Stored hashed in PostgreSQL.
   * 
   * @returns {string} Raw refresh token
   */
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash a refresh token for storage (SHA-256).
   * 
   * @param {string} token - Raw refresh token
   * @returns {string} SHA-256 hash of the token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create and store a refresh token for a user.
   * 
   * @param {string} userId - User UUID
   * @param {string} [deviceInfo] - Device identifier string
   * @returns {Promise<string>} Raw refresh token (to send to client)
   */
  async createRefreshToken(userId, deviceInfo = null) {
    const rawToken = this.generateRefreshToken();
    const tokenHash = this.hashToken(rawToken);

    // Calculate expiry from config (e.g., '7d' → 7 days)
    const expiryMs = this._parseExpiry(config.JWT_REFRESH_EXPIRY);
    const expiresAt = new Date(Date.now() + expiryMs);

    await RefreshToken.create({
      user_id: userId,
      token_hash: tokenHash,
      device_info: deviceInfo,
      expires_at: expiresAt,
    });

    log.debug('Refresh token created', { userId, deviceInfo });
    return rawToken;
  }

  /**
   * Verify and decode a JWT access token.
   * 
   * @param {string} token - JWT access token
   * @returns {object} Decoded token payload
   * @throws {AppError} If token is invalid or expired
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: 'whatsapp-clone-auth',
      });

      if (decoded.type !== 'access') {
        throw new AppError('Invalid token type', 401, 'INVALID_TOKEN');
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (error.name === 'TokenExpiredError') {
        throw new AppError('Access token has expired', 401, 'TOKEN_EXPIRED');
      }

      throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
    }
  }

  /**
   * Verify a refresh token against the database.
   * 
   * @param {string} rawToken - Raw refresh token from client
   * @returns {Promise<object>} { refreshTokenRecord, userId }
   * @throws {AppError} If token is invalid or expired
   */
  async verifyRefreshToken(rawToken) {
    const tokenHash = this.hashToken(rawToken);

    const refreshTokenRecord = await RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!refreshTokenRecord) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    return {
      refreshTokenRecord,
      userId: refreshTokenRecord.user_id,
    };
  }

  /**
   * Rotate a refresh token: delete old one, create new one.
   * Prevents refresh token reuse attacks.
   * 
   * @param {string} oldRawToken - Current refresh token
   * @param {string} userId - User UUID
   * @param {string} [deviceInfo] - Device identifier
   * @returns {Promise<string>} New raw refresh token
   */
  async rotateRefreshToken(oldRawToken, userId, deviceInfo = null) {
    const oldHash = this.hashToken(oldRawToken);

    // Delete the old token
    await RefreshToken.destroy({
      where: { token_hash: oldHash },
    });

    // Create a new one
    return this.createRefreshToken(userId, deviceInfo);
  }

  /**
   * Blacklist an access token in Redis.
   * TTL = remaining time until token expiry.
   * 
   * @param {string} token - JWT access token to blacklist
   */
  async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        log.warn('Cannot blacklist token: unable to decode');
        return;
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl > 0) {
        await redisClient.setex(`${BLACKLIST_PREFIX}${tokenHash}`, ttl, 'revoked');
        log.debug('Token blacklisted', { ttl, userId: decoded.userId });
      }
    } catch (error) {
      log.error('Failed to blacklist token', { error: error.message });
    }
  }

  /**
   * Check if a token is blacklisted.
   * 
   * @param {string} token - JWT access token
   * @returns {Promise<boolean>} True if blacklisted
   */
  async isTokenBlacklisted(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await redisClient.get(`${BLACKLIST_PREFIX}${tokenHash}`);
    return result !== null;
  }

  /**
   * Revoke all refresh tokens for a user (e.g., password change).
   * 
   * @param {string} userId - User UUID
   */
  async revokeAllUserTokens(userId) {
    const deleted = await RefreshToken.destroy({
      where: { user_id: userId },
    });

    log.info('All refresh tokens revoked for user', { userId, count: deleted });
    return deleted;
  }

  /**
   * Clean up expired refresh tokens.
   * Can be called periodically via cron or on startup.
   */
  async cleanupExpiredTokens() {
    const deleted = await RefreshToken.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() },
      },
    });

    if (deleted > 0) {
      log.info('Cleaned up expired refresh tokens', { count: deleted });
    }

    return deleted;
  }

  /**
   * Parse JWT expiry string (e.g., '15m', '7d') to milliseconds.
   * @private
   */
  _parseExpiry(expiryStr) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = expiryStr.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86400000; // Default 7 days
    return parseInt(match[1]) * units[match[2]];
  }
}

module.exports = new TokenService();
