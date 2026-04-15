const request = require('supertest');
const express = require('express');

// Mock dependencies safely mimicking specific outputs testing controller routing explicitly accurately
jest.mock('../../src/services/presence.service', () => ({
  updateHeartbeat: jest.fn(),
  getUserStatus: jest.fn(),
  getBulkStatus: jest.fn(),
}));

const presenceService = require('../../src/services/presence.service');
const presenceRoutes = require('../../src/routes/presence.routes');
const { errorHandler } = require('@whatsapp-clone/shared/middleware/errorHandler');

const app = express();
app.use(express.json());

// Mock injected headers mapping securely
app.use((req, res, next) => {
  req.headers['x-user-id'] = 'mock-presence-id';
  next();
});

app.use('/api/v1/presence', presenceRoutes);
app.use(errorHandler);

describe('Presence API Bounds (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/presence/heartbeat', () => {
    it('should refresh TTL and assign Online mappings matching logic flawlessly', async () => {
      presenceService.updateHeartbeat.mockResolvedValueOnce({ status: 'online', lastSeen: '2026-04-15' });
      
      const response = await request(app).post('/api/v1/presence/heartbeat');
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('online');
      expect(presenceService.updateHeartbeat).toHaveBeenCalledWith('mock-presence-id');
    });
  });

  describe('GET /api/v1/presence/:userId', () => {
    it('should retrieve targeted offline/online statuses successfully mapping cleanly', async () => {
      presenceService.getUserStatus.mockResolvedValueOnce({
        userId: 'target-id',
        isOnline: false,
        lastSeen: '2026-04-15'
      });

      const response = await request(app).get('/api/v1/presence/target-id');
      expect(response.status).toBe(200);
      expect(response.body.data.isOnline).toBe(false);
      expect(presenceService.getUserStatus).toHaveBeenCalledWith('target-id');
    });
  });
});
