const request = require('supertest');
const express = require('express');

// Mock dependencies before importing routes
jest.mock('../../src/services/auth.service', () => ({
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('../../src/middleware/auth', () => {
  return (req, res, next) => {
    req.userId = 'mock-user-id';
    next();
  };
});

const authService = require('../../src/services/auth.service');
const authRoutes = require('../../src/routes/auth.routes');
const { errorHandler } = require('@whatsapp-clone/shared/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should validate request and return 201 on success', async () => {
      authService.register.mockResolvedValueOnce({
        user: { id: 'uuid', username: 'test' },
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          phone: '+1234567890',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(authService.register).toHaveBeenCalled();
    });

    it('should return 400 on validation failure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'te', // too short
          phone: 'invalid', // invalid phone
          password: '123', // too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should validate request and return 200 on success', async () => {
      authService.login.mockResolvedValueOnce({
        user: { id: 'uuid', username: 'test' },
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          login: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(authService.login).toHaveBeenCalled();
    });
  });
});
