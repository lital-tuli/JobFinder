import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import corsMiddleware from "./middlewares/cors.js";
import { loggerMiddleware } from "./logger/loggerService.js";
import router from "./router/router.js";
import { handleError } from "./utils/handleErrors.js";
import seedData from "./utils/seedDB.js";
import connectToDB from "./DB/dbService.js";

// Import rate limiters
import { 
  generalLimiter, 
  authLimiter, 
  apiLimiter,
  jobCreationLimiter,
  applicationLimiter
} from './middlewares/rateLimiter.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy for rate limiting to work correctly behind reverse proxies
app.set('trust proxy', 1);

// CORS middleware (must come before other middleware)
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(loggerMiddleware());

// Health check endpoint (not rate limited)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Apply rate limiters with simplified approach to avoid path-to-regexp issues

// General rate limiter for all requests
app.use(generalLimiter);

// API rate limiter for all API routes
app.use('/api', apiLimiter);

// Auth rate limiter for specific authentication endpoints
app.use('/api/users/login', authLimiter);
app.use((req, res, next) => {
  if (req.path === '/api/users' && req.method === 'POST') {
    return authLimiter(req, res, next);
  }
  next();
});

// Job creation rate limiter
app.use((req, res, next) => {
  if (req.path === '/api/jobs' && req.method === 'POST') {
    return jobCreationLimiter(req, res, next);
  }
  next();
});

// Application rate limiter for job applications
app.use((req, res, next) => {
  // Check if the path matches the pattern for job applications
  if (req.method === 'POST' && req.path.startsWith('/api/jobs/') && req.path.endsWith('/apply')) {
    return applicationLimiter(req, res, next);
  }
  next();
});

// API routes
app.use("/api", router);

// Error handling middleware
app.use((err, req, res, next) => {
  // Log rate limiting errors
  if (err.statusCode === 429) {
    console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
  }
  
  console.error('Server error:', err);
  const message = err.message || "Internal Server Error";
  return handleError(res, err.status || 500, message);
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start the server
const startServer = async () => {
  try {
    console.log('🚀 Starting JobFinder Server...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Connect to MongoDB
    await connectToDB();
    
    // Seed initial data if needed
    await seedData();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🛡️  Rate limiting enabled:');
      console.log('   - General: 1000 requests/day');
      console.log('   - API: 100 requests/15min');
      console.log('   - Authentication: 10 attempts/15min');
      console.log('   - Job Creation: 10 jobs/hour');
      console.log('   - Job Applications: 20 applications/hour');
      console.log('');
      console.log('🎯 Server ready to accept connections!');
    });
  } catch (error) {
    console.error("❌ Server startup error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  // Close server and database connections
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();