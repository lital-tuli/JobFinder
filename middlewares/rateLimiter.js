// middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import logger from '../utils/logger.js';

// General rate limiter - 1000 requests per day per IP
const generalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '24 hours'
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Password reset limiter - very strict
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many password reset attempts, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many API requests, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many API requests, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Slow down middleware - for non-critical endpoints
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500, // ✅ updated for express-slow-down v2
  maxDelayMs: 5000,
  skipFailedRequests: false,
  skipSuccessfulRequests: false
  // Removed deprecated onLimitReached
});

// Job creation limiter - for recruiters posting jobs
const jobCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many job postings, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    logger.warn('Job creation rate limit exceeded', {
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many job postings, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Application submission limiter
const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many job applications, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    logger.warn('Application rate limit exceeded', {
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many job applications, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

export {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  speedLimiter,
  jobCreationLimiter,
  applicationLimiter
};
