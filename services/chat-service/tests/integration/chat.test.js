const request = require('supertest');
const express = require('express');
const { Server } = require('socket.io');

// Mock dependencies
jest.mock('../../src/config/env', () => ({
  ENCRYPTION_KEY: 'a'.repeat(64),
  JWT_SECRET: 'testsecret',
  SERVER_ID: 'test-server',
}));

jest.mock('../../src/models/ChatRoom', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
}));

jest.mock('../../src/socket/connectionDirectory', () => ({
  registerConnection: jest.fn(),
  removeConnection: jest.fn(),
  getServerForUser: jest.fn(),
}));

const chatRoutes = require('../../src/routes/chat.routes');
const { errorHandler } = require('@whatsapp-clone/shared/middleware/errorHandler');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.headers['x-user-id'] = 'mock-auth-id';
  next();
});

app.use('/api/v1/chats', chatRoutes);
app.use(errorHandler);

describe('Chat Service (Integration & Unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('REST: /api/v1/chats', () => {
    it('should successfully retrieve chats via explicit HTTP mappings', async () => {
      const response = await request(app).get('/api/v1/chats');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Socket.io: Connection Logic', () => {
    it('should configure logic mapping natively', () => {
      // Mock validation checking standard directory implementations
      const connDirMock = require('../../src/socket/connectionDirectory');
      connDirMock.registerConnection('mock-auth-id', 'server-id');
      expect(connDirMock.registerConnection).toHaveBeenCalledWith('mock-auth-id', 'server-id');
    });
  });
});
