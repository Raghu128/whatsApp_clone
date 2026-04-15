const authService = require('../../src/services/auth.service');
const { AuthUser } = require('../../src/models');
const tokenService = require('../../src/services/token.service');
const eventPublisher = require('../../src/events/publisher');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');

// Mock dependencies
jest.mock('../../src/models', () => ({
  AuthUser: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  RefreshToken: {
    destroy: jest.fn(),
  }
}));

jest.mock('../../src/services/token.service', () => ({
  generateAccessToken: jest.fn(),
  createRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  rotateRefreshToken: jest.fn(),
  blacklistToken: jest.fn(),
  hashToken: jest.fn(),
}));

jest.mock('../../src/events/publisher', () => ({
  publishUserRegistered: jest.fn(),
}));

describe('AuthService (Unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUserData = {
      username: 'testuser',
      phone: '+1234567890',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      // Setup mocks
      AuthUser.findOne.mockResolvedValueOnce(null); // username check
      AuthUser.findOne.mockResolvedValueOnce(null); // phone check
      
      const mockCreatedUser = {
        id: 'user-uuid',
        username: 'testuser',
        phone: '+1234567890',
        toSafeJSON: () => ({ id: 'user-uuid', username: 'testuser', phone: '+1234567890' }),
      };
      AuthUser.create.mockResolvedValueOnce(mockCreatedUser);
      
      tokenService.generateAccessToken.mockReturnValue('mock-access-token');
      tokenService.createRefreshToken.mockResolvedValue('mock-refresh-token');

      // Execute
      const result = await authService.register(mockUserData);

      // Assert
      expect(AuthUser.findOne).toHaveBeenCalledTimes(2);
      expect(AuthUser.create).toHaveBeenCalledWith(expect.objectContaining({
        username: 'testuser',
        phone: '+1234567890',
        password_hash: 'password123',
      }));
      expect(tokenService.generateAccessToken).toHaveBeenCalled();
      expect(tokenService.createRefreshToken).toHaveBeenCalled();
      expect(eventPublisher.publishUserRegistered).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-uuid',
        username: 'testuser',
      }));
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
    });

    it('should throw error if username is taken', async () => {
      AuthUser.findOne.mockResolvedValueOnce({ id: 'existing' });

      await expect(authService.register(mockUserData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('login', () => {
    const mockCredentials = {
      login: 'testuser',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const mockUser = {
        id: 'user-uuid',
        username: 'testuser',
        is_active: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        toSafeJSON: () => ({ id: 'user-uuid', username: 'testuser' }),
      };

      AuthUser.findOne.mockResolvedValueOnce(mockUser);
      tokenService.generateAccessToken.mockReturnValue('mock-access-token');
      tokenService.createRefreshToken.mockResolvedValue('mock-refresh-token');

      const result = await authService.login(mockCredentials);

      expect(AuthUser.findOne).toHaveBeenCalled();
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
    });

    it('should throw error on invalid credentials', async () => {
      AuthUser.findOne.mockResolvedValueOnce(null);

      await expect(authService.login(mockCredentials))
        .rejects
        .toThrow('Invalid credentials');
    });
  });
});
