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

// Apply rate limiting BEFORE other middleware
// Trust proxy for rate limiting to work correctly behind reverse proxies
app.set('trust proxy', 1);

// Apply general rate limiter to all requests (1000 requests per day)
app.use(generalLimiter);

// CORS middleware (must come before rate-limited routes)
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

// Apply API limiter to all API routes (100 requests per 15 minutes)
app.use('/api', apiLimiter);

// Apply auth limiter to authentication routes (10 attempts per 15 minutes)
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Apply job creation limiter to job posting (10 jobs per hour)
app.use('/api/jobs', (req, res, next) => {
  if (req.method === 'POST' && !req.path.includes('/apply') && !req.path.includes('/save')) {
    return jobCreationLimiter(req, res, next);
  }
  next();
});

// Apply application limiter to job applications (20 applications per hour)
// Note: Using a more specific pattern to avoid the path-to-regexp issue
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.match(/^\/api\/jobs\/[^\/]+\/apply$/)) {
    return applicationLimiter(req, res, next);
  }
  next();
});

// API routes (this should come after rate limiting)
app.use("/api", router);

// Error handling middleware
app.use((err, req, res, next) => {
  // Log rate limiting errors
  if (err.statusCode === 429) {
    console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
  }
  
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
    // Connect to MongoDB
    await connectToDB();
    console.log("MongoDB connected successfully");

    // Seed initial data if needed
    await seedData();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      
      // Log rate limiting status
      console.log("Rate limiting enabled:");
      console.log("  - General: 1000 requests/day");
      console.log("  - API: 100 requests/15min");
      console.log("  - Authentication: 10 attempts/15min");
      console.log("  - Job Creation: 10 jobs/hour");
      console.log("  - Job Applications: 20 applications/hour");
    });
  } catch (error) {
    console.error("Server error:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();