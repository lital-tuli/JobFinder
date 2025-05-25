import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import corsMiddleware from "./middlewares/cors.js";
import { loggerMiddleware } from "./logger/loggerService.js";
import router from "./router/router.js";
import { handleError } from "./utils/handleErrors.js";
import seedData from "./utils/seedDB.js";
import connectToDB from "./DB/dbService.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Memory optimization settings
app.set('trust proxy', 1);
app.set('x-powered-by', false); // Remove X-Powered-By header

// CORS middleware (must come before other middleware)
app.use(corsMiddleware);

// Body parsing middleware with limits to prevent memory issues
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
app.use(loggerMiddleware());

// Health check endpoint
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    }
  });
});

// API routes
app.use("/api", router);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
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

// Memory monitoring (development only)
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      logger.warn('High memory usage detected:', {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
      });
    }
  }, 30000); // Check every 30 seconds
}

// Start the server
const startServer = async () => {
  try {
    logger.server('Starting JobFinder Server...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Connect to MongoDB
    await connectToDB();
    
    // Seed initial data if needed
    await seedData();
    
    // Start listening
    const server = app.listen(PORT, () => {
      logger.server(`Server running on port ${PORT}`);
      logger.info(`API available at: http://localhost:${PORT}/api`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.server('Server ready to accept connections!');
    });

    // Set server timeout to prevent hanging connections
    server.timeout = 30000; // 30 seconds
    
  } catch (error) {
    logger.error("Server startup error:", error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.warn(`${signal} received, shutting down gracefully...`);
  
  // Force exit after 10 seconds if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forcing server shutdown...');
    process.exit(1);
  }, 10000);
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise: promise.toString() });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Periodic garbage collection in development
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    if (global.gc) {
      global.gc();
      logger.debug('Garbage collection triggered');
    }
  }, 60000); // Every minute
}

startServer();