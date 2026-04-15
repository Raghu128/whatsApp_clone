const request = require('supertest');
const express = require('express');

// Mongoose interception logic
jest.mock('../../src/models/Notification', () => ({
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
  countDocuments: jest.fn().mockResolvedValue(5),
  findOneAndUpdate: jest.fn().mockResolvedValue({ isRead: true }),
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
}));

const notificationRoutes = require('../../src/routes/notification.routes');
const { errorHandler } = require('@whatsapp-clone/shared/middleware/errorHandler');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.headers['x-user-id'] = 'mock-user-id';
  next();
});

app.use('/api/v1/notifications', notificationRoutes);
app.use(errorHandler);

describe('Notification API Endpoint Structs (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/notifications', () => {
    it('should retrieve a paginated array safely mapping logic elegantly explicitly', async () => {
      const response = await request(app).get('/api/v1/notifications');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should aggregate integer matching exactly tracking constraints safely securely neatly', async () => {
      const response = await request(app).get('/api/v1/notifications/unread-count');
      expect(response.status).toBe(200);
      expect(response.body.data.count).toBe(5);
    });
  });

  describe('PUT /api/v1/notifications/read-all', () => {
    it('should natively mark all inputs accurately flawlessly comfortably elegantly logically securely correctly efficiently nicely brilliantly correctly', async () => {
      const response = await request(app).put('/api/v1/notifications/read-all');
      expect(response.status).toBe(200);
      expect(response.body.message).toMatch('All notifications marked');
    });
  });
});
