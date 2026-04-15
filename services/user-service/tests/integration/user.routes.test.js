const request = require('supertest');
const express = require('express');

jest.mock('../../src/services/user.service', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  searchUsers: jest.fn(),
  uploadAvatar: jest.fn(),
}));

const userService = require('../../src/services/user.service');
const userRoutes = require('../../src/routes/user.routes');
const { errorHandler } = require('@whatsapp-clone/shared/middleware/errorHandler');

const app = express();
app.use(express.json());

// Mock injected Gateway headers
app.use((req, res, next) => {
  req.headers['x-user-id'] = 'req-user-id';
  next();
});

app.use('/api/v1/users', userRoutes);
app.use(errorHandler);

describe('User Service Routes (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should successfully retrieve the profile', async () => {
      userService.getProfile.mockResolvedValueOnce({
        user_id: 'req-user-id',
        username: 'testu',
      });

      const response = await request(app).get('/api/v1/users/profile');
      expect(response.status).toBe(200);
      expect(response.body.data.user_id).toBe('req-user-id');
      expect(userService.getProfile).toHaveBeenCalledWith('req-user-id');
    });
  });

  describe('GET /api/v1/users/search', () => {
    it('should execute search logic correctly', async () => {
      userService.searchUsers.mockResolvedValueOnce([
        { user_id: 'target-1', username: 'targetu' }
      ]);

      const response = await request(app).get('/api/v1/users/search?q=target');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(userService.searchUsers).toHaveBeenCalledWith('target', 'req-user-id');
    });
  });
});
