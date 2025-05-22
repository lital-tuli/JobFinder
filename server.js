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

// Trust proxy for better request handling behind reverse proxies
app.set('trust proxy', 1);

// CORS middleware (must come before other middleware)
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(loggerMiddleware());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
    app.listen(PORT, () => {
      logger.server(`Server running on port ${PORT}`);
      logger.info(`API available at: http://localhost:${PORT}/api`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.server('Server ready to accept connections!');
    });
  } catch (error) {
    logger.error("Server startup error:", error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.warn(`${signal} received, shutting down gracefully...`);
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

startServer();