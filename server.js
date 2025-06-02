import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";

// Import middlewares and services
import corsMiddleware from "./middlewares/cors.js";
import { loggerMiddleware } from "./logger/loggerService.js";
import router from "./router/router.js";
import { handleError } from "./utils/handleErrors.js";
import seedData from "./utils/seedDB.js";
import connectToDB from "./DB/dbService.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks in development
      return NODE_ENV === 'development' && req.path === '/health';
    },
  });
};

// Apply different rate limits for different routes
app.use('/api/users/login', createRateLimit(15 * 60 * 1000, 5, 'Too many login attempts, please try again later'));
app.use('/api/users', createRateLimit(15 * 60 * 1000, 50, 'Too many requests to user endpoints'));
app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests, please try again later'));

// Memory optimization settings
app.set('trust proxy', 1);
app.set('x-powered-by', false); // Remove X-Powered-By header

// =============================================================================
// GENERAL MIDDLEWARE
// =============================================================================

// Compression middleware for better performance
app.use(compression());

// CORS middleware (must come before other middleware)
app.use(corsMiddleware);

// Body parsing middleware with limits to prevent memory issues
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 50
}));
app.use(cookieParser());

// Logging middleware
app.use(loggerMiddleware());

// =============================================================================
// STATIC FILE SERVING
// =============================================================================

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const uploadDirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'profiles'),
    path.join(__dirname, 'uploads', 'resumes')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
};

ensureUploadDirs();

// Enhanced static file serving with proper headers and security
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: NODE_ENV === 'production' ? '1d' : '0', // Cache for 1 day in production
  etag: true,
  lastModified: true,
  index: false, // Disable directory indexing for security
  setHeaders: (res, filePath, stat) => {
    // Security headers for uploaded files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Set proper content types
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    } else if (['.doc', '.docx'].includes(ext)) {
      res.setHeader('Content-Type', 'application/msword');
    }
    
    // For resumes, suggest download instead of inline display (optional security measure)
    if (filePath.includes('/resumes/')) {
      const filename = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Prevent caching of sensitive files in development
    if (NODE_ENV === 'development') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// =============================================================================
// HEALTH CHECK AND MONITORING
// =============================================================================

// Health check endpoint with detailed information
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  // Check if upload directories exist
  const uploadDirsStatus = {
    profiles: fs.existsSync(path.join(__dirname, 'uploads', 'profiles')),
    resumes: fs.existsSync(path.join(__dirname, 'uploads', 'resumes'))
  };
  
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    },
    uploadDirs: uploadDirsStatus
  };
  
  res.status(200).json(healthData);
});

// System info endpoint (admin only in production)
app.get('/system-info', (req, res) => {
  if (NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const systemInfo = {
    nodejs: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuUsage: process.cpuUsage(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    pid: process.pid,
    cwd: process.cwd(),
    env: NODE_ENV
  };
  
  res.json(systemInfo);
});

// =============================================================================
// API ROUTES
// =============================================================================

// API routes
app.use("/api", router);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for non-API routes
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log the full error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const message = NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  const statusCode = err.status || err.statusCode || 500;
  
  return res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =============================================================================
// MONITORING AND CLEANUP
// =============================================================================

// Memory monitoring (development and staging only)
if (NODE_ENV !== 'production') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB > 500) { // 500MB threshold
      logger.warn('High memory usage detected:', {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      });
    }
  }, 30000); // Check every 30 seconds
}

// Import improved file cleanup utility
import { cleanupOrphanedFiles, fixMisplacedFiles } from "./utils/fileCleanup.js";

// Run cleanup weekly in production, daily in development
const cleanupInterval = NODE_ENV === 'production' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
setInterval(cleanupOrphanedFiles, cleanupInterval);

// Periodic garbage collection in development
if (NODE_ENV === 'development' && global.gc) {
  setInterval(() => {
    global.gc();
    logger.debug('Manual garbage collection triggered');
  }, 60000); // Every minute
}

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Start the server
const startServer = async () => {
  try {
    logger.server('Starting JobFinder Server...');
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`Node.js version: ${process.version}`);
    
    // Connect to MongoDB
    await connectToDB();
    
    // Seed initial data if needed
    await seedData();
    
    // Fix any misplaced files first
    setTimeout(async () => {
      await fixMisplacedFiles();
      await cleanupOrphanedFiles();
    }, 5000); // Run after 5 seconds
    
    // Start listening
    const server = app.listen(PORT, () => {
      logger.server(`Server running on port ${PORT}`);
      logger.info(`API available at: http://localhost:${PORT}/api`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Uploads directory: ${path.join(__dirname, 'uploads')}`);
      logger.server('Server ready to accept connections!');
    });

    // Set server timeout to prevent hanging connections
    server.timeout = 30000; // 30 seconds
    server.keepAliveTimeout = 61000; // 61 seconds (should be longer than load balancer timeout)
    server.headersTimeout = 62000; // 62 seconds (should be longer than keepAliveTimeout)
    
    return server;
    
  } catch (error) {
    logger.error("Server startup error:", error);
    process.exit(1);
  }
};

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.warn(`${signal} received, shutting down gracefully...`);
  
  // Force exit after 10 seconds if graceful shutdown takes too long
  const forceExitTimer = setTimeout(() => {
    logger.error('Forcing server shutdown...');
    process.exit(1);
  }, 10000);
  
  // Close server and database connections
  const closeServer = async () => {
    try {
      // If server is running, close it
      if (server) {
        server.close(() => {
          logger.info('HTTP server closed');
        });
      }
      
      // Close database connection
      const mongoose = (await import('mongoose')).default;
      await mongoose.connection.close();
      logger.info('Database connection closed');
      
      clearTimeout(forceExitTimer);
      logger.success('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  closeServer();
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise.toString(),
    reason: reason
  });
  
  // In production, we might want to exit
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  
  // Always exit on uncaught exceptions
  process.exit(1);
});

// Handle warning events
process.on('warning', (warning) => {
  logger.warn('Node.js warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Start the server
let server;
startServer().then((srv) => {
  server = srv;
}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;