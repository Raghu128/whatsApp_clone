/**
 * Auth Controller
 * 
 * HTTP request handlers for authentication endpoints.
 * Delegates business logic to auth.service.js.
 */

const { success, error: errorResponse } = require('@whatsapp-clone/shared/utils/responseFormatter');

const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

const authController = {
  /**
   * POST /api/v1/auth/register
   * Register a new user account.
   */
  async register(req, res, next) {
    try {
      const { username, phone, email, password } = req.body;
      const deviceInfo = req.headers['user-agent'] || null;

      const result = await authService.register({
        username,
        phone,
        email,
        password,
        deviceInfo,
      });

      return success(res, {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      }, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/login
   * Login with username/phone and password.
   */
  async login(req, res, next) {
    try {
      const { login, password } = req.body;
      const deviceInfo = req.headers['user-agent'] || null;

      const result = await authService.login({
        login,
        password,
        deviceInfo,
      });

      return success(res, {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token.
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const deviceInfo = req.headers['user-agent'] || null;

      const result = await authService.refreshTokens(refreshToken, deviceInfo);

      return success(res, {
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      }, 'Tokens refreshed successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   * Logout — blacklist access token + delete refresh token.
   */
  async logout(req, res, next) {
    try {
      // Extract the access token from Authorization header
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      const { refreshToken } = req.body;

      if (!accessToken) {
        return errorResponse(res, 'No access token provided', 400, 'MISSING_TOKEN');
      }

      await authService.logout(accessToken, refreshToken);

      return success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   * Get current user info (requires valid token).
   */
  async me(req, res, next) {
    try {
      const user = await authService.getUserById(req.userId);
      return success(res, { user }, 'User retrieved');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
