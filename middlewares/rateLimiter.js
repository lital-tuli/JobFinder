// middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import logger from '../utils/logger.js';

// General rate limiter - 1000 requests per day per IP
const generalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '24 hours'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login/register attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
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
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
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

// API rate limiter - for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 API requests per 15 minutes
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 5000, // maximum delay of 5 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  onLimitReached: (req, res, options) => {
    logger.warn('Speed limit reached', {
      ip: req.ip,
      endpoint: req.path,
      userAgent: req.get('User-Agent')
    });
  }
});

// Job creation limiter - for recruiters posting jobs
const jobCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 job postings per hour
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
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 job applications per hour
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

// Export all limiters
export {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  speedLimiter,
  jobCreationLimiter,
  applicationLimiter
};

