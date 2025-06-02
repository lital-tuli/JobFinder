// users/routes/userRoutes.js - Main user routes router (2-file split)
import express from "express";
import authRoutes from "./authRoutes.js";
import fileRoutes from "./fileRoutes.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// =============================================================================
// ROUTE ORGANIZATION
// =============================================================================

// Mount the two main route modules
router.use("/", authRoutes);    // Authentication & Profile Management
router.use("/", fileRoutes);    // File Upload & Management

// =============================================================================
// API DOCUMENTATION
// =============================================================================

// Get API documentation for user routes
router.get("/docs", (req, res) => {
  const documentation = {
    message: "JobFinder User API Documentation",
    version: "2.0.0",
    organization: "Split into 2 main modules",
    modules: {
      authRoutes: {
        description: "Authentication and Profile Management",
        endpoints: [
          "GET /check-auth - Check authentication status",
          "POST / - Register new user", 
          "POST /login - User login",
          "POST /logout - User logout",
          "GET /:id - Get user profile",
          "PUT /:id - Update user profile",
          "GET /profile/me - Get current user profile",
          "PUT /profile/me - Update current user profile",
          "GET /:id/saved-jobs - Get saved jobs",
          "GET /:id/applied-jobs - Get applied jobs",
          "GET /jobs/saved - Get current user's saved jobs",
          "GET /jobs/applied - Get current user's applied jobs",
          "GET /jobs/activity - Get job activity summary"
        ]
      },
      fileRoutes: {
        description: "File Upload and Management",
        endpoints: [
          "POST /profile/picture - Upload profile picture",
          "POST /profile/resume - Upload resume",
          "DELETE /profile/picture - Delete profile picture",
          "DELETE /profile/resume - Delete resume",
          "GET /profile/files - Get files information",
          "GET /profile/resume/download - Download resume",
          "POST /profile - Legacy profile picture upload"
        ]
      }
    },
    fileUpload: {
      profilePicture: {
        maxSize: "5MB",
        allowedTypes: ["JPG", "JPEG", "PNG", "GIF", "WebP"],
        fieldName: "profilePicture"
      },
      resume: {
        maxSize: "10MB", 
        allowedTypes: ["PDF", "DOC", "DOCX"],
        fieldName: "resume"
      }
    },
    authentication: {
      required: "Most endpoints require x-auth-token header",
      exceptions: ["POST /", "POST /login", "GET /docs", "GET /health"]
    },
    notes: [
      "All legacy routes are maintained for backward compatibility",
      "File uploads use multipart/form-data",
      "Profile pictures are automatically optimized",
      "Resumes can be downloaded with authentication"
    ]
  };

  res.status(200).json(documentation);
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

// Health check for user routes
router.get("/health", (req, res) => {
  const health = {
    status: "OK",
    service: "User Routes",
    timestamp: new Date().toISOString(),
    modules: {
      authRoutes: "active",
      fileRoutes: "active"
    },
    uptime: process.uptime(),
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  };

  logger.debug('User routes health check requested');
  res.status(200).json(health);
});

// =============================================================================
// CATCH-ALL ERROR HANDLER
// =============================================================================

// Handle 404 for unknown user routes
router.use("*", (req, res) => {
  logger.warn(`404 - User route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "User route not found",
    path: req.originalUrl,
    method: req.method,
    message: "Check /api/users/docs for available endpoints",
    suggestion: "Verify the endpoint URL and HTTP method"
  });
});

export default router;