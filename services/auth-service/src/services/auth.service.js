/**
 * Auth Service — Business Logic
 * 
 * Handles registration, login, token refresh, and logout flows.
 * Publishes user.registered events via Redis Pub/Sub.
 * 
 * Tasks: 2.4, 2.5, 2.6, 2.7, 2.8, 2.11
 */

const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const logger = require('@whatsapp-clone/shared/utils/logger');

const { AuthUser } = require('../models');
const tokenService = require('./token.service');
const eventPublisher = require('../events/publisher');

const log = logger.child({ service: 'auth-service', component: 'auth-service' });

class AuthService {
  /**
   * Register a new user.
   * 
   * 1. Create user record (password auto-hashed via model hook)
   * 2. Generate access + refresh tokens
   * 3. Publish user.registered event
   * 
   * @param {object} userData - { username, phone, email, password }
   * @returns {Promise<object>} { user, accessToken, refreshToken }
   */
  async register(userData) {
    const { username, phone, email, password, deviceInfo } = userData;

    // Check for existing user
    const existingUser = await AuthUser.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new AppError('Username is already taken', 409, 'DUPLICATE_USERNAME');
    }

    const existingPhone = await AuthUser.findOne({
      where: { phone },
    });
    if (existingPhone) {
      throw new AppError('Phone number is already registered', 409, 'DUPLICATE_PHONE');
    }

    if (email) {
      const existingEmail = await AuthUser.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new AppError('Email is already registered', 409, 'DUPLICATE_EMAIL');
      }
    }

    // Create user (password_hash field receives plaintext — bcrypt hook hashes it)
    const user = await AuthUser.create({
      username,
      phone,
      email: email || null,
      password_hash: password,
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
    });
    const refreshToken = await tokenService.createRefreshToken(user.id, deviceInfo);

    // Publish event: user.registered (Task 2.11)
    await eventPublisher.publishUserRegistered({
      userId: user.id,
      phone: user.phone,
      username: user.username,
    });

    log.info('User registered successfully', { userId: user.id, username: user.username });

    return {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login an existing user.
   * 
   * 1. Find user by username or phone
   * 2. Verify password with bcrypt
   * 3. Generate access + refresh tokens
   * 
   * @param {object} credentials - { login (username or phone), password }
   * @returns {Promise<object>} { user, accessToken, refreshToken }
   */
  async login(credentials) {
    const { login, password, deviceInfo } = credentials;

    // Find user by username or phone
    const { Op } = require('sequelize');
    const user = await AuthUser.findOne({
      where: {
        [Op.or]: [
          { username: login },
          { phone: login },
        ],
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Verify password (bcrypt compare)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
    });
    const refreshToken = await tokenService.createRefreshToken(user.id, deviceInfo);

    log.info('User logged in', { userId: user.id, username: user.username });

    return {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh an expired access token using a valid refresh token.
   * Implements token rotation — old refresh token is invalidated.
   * 
   * @param {string} refreshTokenStr - Current refresh token
   * @param {string} [deviceInfo] - Device identifier
   * @returns {Promise<object>} { accessToken, refreshToken }
   */
  async refreshTokens(refreshTokenStr, deviceInfo = null) {
    // Verify the refresh token
    const { userId } = await tokenService.verifyRefreshToken(refreshTokenStr);

    // Get the user
    const user = await AuthUser.findByPk(userId);
    if (!user || !user.is_active) {
      throw new AppError('User not found or deactivated', 401, 'USER_NOT_FOUND');
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
    });

    // Rotate refresh token (delete old, create new)
    const newRefreshToken = await tokenService.rotateRefreshToken(
      refreshTokenStr,
      userId,
      deviceInfo
    );

    log.debug('Tokens refreshed', { userId });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout a user.
   * 
   * 1. Blacklist the current access token in Redis
   * 2. Delete the refresh token from PostgreSQL
   * 
   * @param {string} accessToken - Current JWT access token
   * @param {string} [refreshTokenStr] - Current refresh token (if provided)
   */
  async logout(accessToken, refreshTokenStr = null) {
    // Blacklist the access token (Task 2.10)
    await tokenService.blacklistToken(accessToken);

    // Delete the refresh token
    if (refreshTokenStr) {
      const tokenHash = tokenService.hashToken(refreshTokenStr);
      await require('../models/RefreshToken').destroy({
        where: { token_hash: tokenHash },
      });
    }

    log.info('User logged out successfully');
  }

  /**
   * Get user by ID.
   * Used by gRPC server.
   * 
   * @param {string} userId - User UUID
   * @returns {Promise<object>} User data (safe)
   */
  async getUserById(userId) {
    const user = await AuthUser.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user.toSafeJSON();
  }
}

module.exports = new AuthService();
