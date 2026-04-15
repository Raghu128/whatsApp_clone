/**
 * Auth Routes
 * 
 * Maps HTTP endpoints to controller methods with validation middleware.
 * 
 * POST /api/v1/auth/register  — Register new user
 * POST /api/v1/auth/login     — Login
 * POST /api/v1/auth/refresh   — Refresh tokens
 * POST /api/v1/auth/logout    — Logout
 * GET  /api/v1/auth/me        — Get current user (protected)
 */

const { Router } = require('express');
const { validate } = require('@whatsapp-clone/shared/middleware/validator');

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} = require('../middleware/validator');

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, phone, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: securePass123
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: User already exists
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with username/phone and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, password]
 *             properties:
 *               login:
 *                 type: string
 *                 description: Username or phone number
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: securePass123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validate(refreshSchema), authController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — blacklist access token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', validate(logoutSchema), authController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authMiddleware, authController.me);

module.exports = router;
