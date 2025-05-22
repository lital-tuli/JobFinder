import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

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
    console.warn('Rate limit exceeded', {
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
  max: 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn('Authentication rate limit exceeded', {
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

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many API requests, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req, res) => {
    console.warn('API rate limit exceeded', {
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

// Job creation limiter - for recruiters posting jobs
const jobCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too many job postings, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    console.warn('Job creation rate limit exceeded', {
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
  max: 20,
  message: {
    error: 'Too many job applications, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    console.warn('Application rate limit exceeded', {
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
  apiLimiter,
  jobCreationLimiter,
  applicationLimiter
};