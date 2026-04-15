/**
 * Rate Limiter Middleware
 * 
 * Global rate limiting mechanism powered by Redis preventing DDoS attacks
 * and brute force requests to specific endpoints.
 * 
 * Task 3.9
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient } = require('../config/redis');

// General API Rate Limiter
// Max 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'ratelimit:general:',
  }),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});

// Stricter limiter for specific endpoints like login/registration
// Max 10 requests per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'ratelimit:auth:',
  }),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
};
