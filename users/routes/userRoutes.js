// users/routes/userRoutes.js - Main User Routes Router (3-route structure)
import express from "express";
import authRoutes from "./authRoutes.js";
import fileRoutes from "./fileRoutes.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// =============================================================================
// ROUTE ORGANIZATION
// =============================================================================

// Mount the three main route modules
router.use("/", authRoutes);    // Authentication & Profile Management
router.use("/", fileRoutes);    // File Upload & Management

// Note: Admin routes are mounted separately in the main router at /admin

// =============================================================================
// API DOCUMENTATION
// =============================================================================

// Get API documentation for user routes
router.get("/docs", (req, res) => {
  const documentation = {
    message: "JobFinder User API Documentation",
    version: "3.0.0",
    organization: "Split into 3 main modules: Auth, File, and Admin (separate)",
    modules: {
      authRoutes: {
        description: "Authentication and Profile Management",
        endpoints: [
          "GET /api/users/check-auth - Check authentication status",
          "POST /api/users/ - Register new user", 
          "POST /api/users/login - User login",
          "POST /api/users/logout - User logout",
          "GET /api/users/:id - Get user profile",
          "PUT /api/users/:id - Update user profile",
          "GET /api/users/profile/me - Get current user profile",
          "PUT /api/users/profile/me - Update current user profile",
          "GET /api/users/:id/saved-jobs - Get saved jobs",
          "GET /api/users/:id/applied-jobs - Get applied jobs",
          "GET /api/users/jobs/saved - Get current user's saved jobs",
          "GET /api/users/jobs/applied - Get current user's applied jobs",
          "GET /api/users/jobs/activity - Get job activity summary"
        ]
      },
      fileRoutes: {
        description: "File Upload and Management",
        endpoints: [
          "POST /api/users/profile/picture - Upload profile picture",
          "POST /api/users/profile/resume - Upload resume",
          "DELETE /api/users/profile/picture - Delete profile picture",
          "DELETE /api/users/profile/resume - Delete resume",
          "GET /api/users/profile/files - Get files information",
          "GET /api/users/profile/resume/download - Download resume",
          "POST /api/users/profile - Legacy profile picture upload"
        ]
      },
      adminRoutes: {
        description: "Admin User Management (separate module at /admin)",
        endpoints: [
          "GET /api/admin/users - Get all users (admin only)",
          "PUT /api/admin/users/:id/role - Update user role (admin only)",
          "PUT /api/admin/users/:id/status - Toggle user status (admin only)",
          "DELETE /api/admin/users/:id - Delete user with file cleanup (admin only)",
          "GET /api/admin/stats - Get system statistics (admin only)"
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
      exceptions: ["POST /api/users/", "POST /api/users/login", "GET /api/users/docs", "GET /api/users/health"]
    },
    userDeletion: {
      description: "User deletion with file cleanup",
      endpoint: "DELETE /api/admin/users/:id",
      restrictions: ["Admin only", "Cannot delete self", "Cleans up profile pictures and resumes"],
      process: [
        "1. Verify admin permissions",
        "2. Prevent self-deletion",
        "3. Delete associated files (profile picture, resume)",
        "4. Remove from job applications",
        "5. Delete job posts if recruiter",
        "6. Delete user record"
      ]
    },
    notes: [
      "All legacy routes are maintained for backward compatibility",
      "File uploads use multipart/form-data",
      "Profile pictures are automatically optimized",
      "Resumes can be downloaded with authentication",
      "User deletion includes comprehensive file cleanup",
      "Admin routes are in separate module for security"
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
      fileRoutes: "active",
      adminRoutes: "separate module - check /api/admin/health"
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
    suggestion: "Verify the endpoint URL and HTTP method",
    availableModules: {
      auth: "Authentication and profile management",
      file: "File upload and management", 
      admin: "Admin operations at /api/admin/*"
    }
  });
});

export default router;