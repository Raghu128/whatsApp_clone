const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    call: jest.fn().mockResolvedValue([0, 1]), // Mock sliding window rate-limit call
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { redisClient } = require('../../src/config/redis');

// Instead of loading full setup, proxy middlewares are tested against custom handlers
const authMiddleware = require('../../src/middleware/auth');

describe('API Gateway (Integration)', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup a dummy app with the middleware
    app = express();
    app.get('/api/v1/gateway/status', (req, res) => res.json({ status: 'ok' }));
    app.get('/api/v1/auth/login', (req, res) => res.json({ public: true }));
    
    app.use(authMiddleware);
    app.get('/api/v1/users/me', (req, res) => res.json({ 
      success: true, 
      userId: req.headers['x-user-id'] 
    }));
    
    // Add global error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({ error: err.message });
    });
  });

  describe('JWT Stateless Authorization', () => {
    it('should bypass auth for public routes', async () => {
      const response = await request(app).get('/api/v1/auth/login');
      expect(response.status).toBe(200);
      expect(response.body.public).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/users/me');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or malformed Authorization header');
    });

    it('should reject blacklisted token', async () => {
      redisClient.get.mockResolvedValueOnce('revoked'); // Simulate revoked
      
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer dummy-token');
        
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token has been revoked');
    });

    it('should inject x-user-id header on success', async () => {
      redisClient.get.mockResolvedValueOnce(null); // Not blacklisted
      jwt.verify.mockReturnValueOnce({ userId: 'user-123', username: 'testuser' });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe('user-123'); // Validated it made it to the dummy handler
    });
  });
});
