import express from "express";
import Job from "../../DB/models/Job.js"; 
import {
  getAllUsers,
  getAllJobsForAdmin,
  updateUserRole,
  deleteUser,
  bulkDeleteUsers,
  getSystemStats,
  toggleUserStatus,
  updateJobForAdmin,
  deleteJobForAdmin,
  toggleJobStatus,
  bulkDeleteJobs,
  getJobStatistics
} from "../models/adminAccessDataService.js";
import auth from "../../auth/authService.js";
import { handleError } from "../../utils/handleErrors.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    logger.warn('Non-admin user attempted to access admin route', {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      endpoint: req.path
    });
    return handleError(res, 403, "Access denied. Admin privileges required.");
  }
  next();
};

// Enhanced admin middleware with additional logging
const requireAdminWithLogging = (req, res, next) => {
  if (!req.user.isAdmin) {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return handleError(res, 403, "Access denied. Admin privileges required.");
  }
  
  logger.info('Admin action initiated', {
    adminId: req.user._id,
    email: req.user.email,
    endpoint: req.path,
    method: req.method
  });
  
  next();
};

// =============================================================================
// USER MANAGEMENT ROUTES
// =============================================================================

// Get all users (admin only)
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    if (users.error) {
      return handleError(res, users.status || 500, users.message);
    }
    
    logger.info('Admin retrieved all users', {
      adminId: req.user._id,
      userCount: users.length
    });
    
    return res.status(200).json(users);
  } catch (error) {
    logger.error('Get all users error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Update user role
router.put("/users/:id/role", auth, requireAdminWithLogging, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    // Prevent admin from changing their own role unless there are other admins
    if (userId === req.user._id && role !== 'admin') {
      logger.warn('Admin attempted to remove own admin privileges', {
        adminId: req.user._id,
        targetUserId: userId
      });
      return handleError(res, 400, "You cannot remove your own admin privileges");
    }
    
    if (!role || !['jobseeker', 'recruiter', 'admin'].includes(role)) {
      return handleError(res, 400, "Invalid role. Must be 'jobseeker', 'recruiter', or 'admin'");
    }
    
    const updatedUser = await updateUserRole(userId, role);
    if (updatedUser.error) {
      return handleError(res, updatedUser.status || 500, updatedUser.message);
    }
    
    logger.info('User role updated', {
      adminId: req.user._id,
      targetUserId: userId,
      newRole: role,
      targetUserEmail: updatedUser.email
    });
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('Update user role error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Toggle user status (active/inactive)
router.put("/users/:id/status", auth, requireAdminWithLogging, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deactivating themselves
    if (userId === req.user._id) {
      logger.warn('Admin attempted to deactivate own account', {
        adminId: req.user._id
      });
      return handleError(res, 400, "You cannot deactivate your own account");
    }
    
    const result = await toggleUserStatus(userId);
    
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    logger.info('User status toggled', {
      adminId: req.user._id,
      targetUserId: userId,
      newStatus: result.user.isActive ? 'active' : 'inactive',
      targetUserEmail: result.user.email
    });
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Toggle user status error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Enhanced DELETE user route with comprehensive file cleanup
router.delete("/users/:id", auth, requireAdminWithLogging, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Security checks
    if (userId === req.user._id) {
      logger.warn('Admin attempted to delete own account', {
        adminId: req.user._id
      });
      return handleError(res, 400, "Cannot delete your own account");
    }
    
    // Additional validation for user ID format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return handleError(res, 400, "Invalid user ID format");
    }
    
    logger.info('Initiating user deletion with file cleanup', {
      adminId: req.user._id,
      targetUserId: userId,
      adminEmail: req.user.email
    });
    
    const result = await deleteUser(userId);
    if (result.error) {
      logger.error('User deletion failed', {
        adminId: req.user._id,
        targetUserId: userId,
        error: result.message
      });
      return handleError(res, result.status || 500, result.message);
    }
    
    logger.info('User deletion completed successfully', {
      adminId: req.user._id,
      targetUserId: userId,
      deletionDetails: result.details
    });
    
    return res.status(200).json({
      ...result,
      timestamp: new Date().toISOString(),
      deletedBy: {
        adminId: req.user._id,
        adminEmail: req.user.email
      }
    });
  } catch (error) {
    logger.error('User deletion error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Bulk delete users with file cleanup
router.delete("/users/bulk", auth, requireAdminWithLogging, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return handleError(res, 400, "User IDs array is required");
    }
    
    // Prevent admin from deleting themselves
    if (userIds.includes(req.user._id)) {
      logger.warn('Admin attempted to include self in bulk deletion', {
        adminId: req.user._id,
        userIds
      });
      return handleError(res, 400, "Cannot include your own account in bulk deletion");
    }
    
    // Validate user ID formats
    const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
    if (invalidIds.length > 0) {
      return handleError(res, 400, `Invalid user ID formats: ${invalidIds.join(', ')}`);
    }
    
    logger.info('Initiating bulk user deletion', {
      adminId: req.user._id,
      userCount: userIds.length,
      userIds
    });
    
    const result = await bulkDeleteUsers(userIds);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    logger.info('Bulk user deletion completed', {
      adminId: req.user._id,
      requestedCount: userIds.length,
      actualDeleted: result.details.deletedUsers,
      deletionDetails: result.details
    });
    
    return res.status(200).json({
      ...result,
      timestamp: new Date().toISOString(),
      deletedBy: {
        adminId: req.user._id,
        adminEmail: req.user.email
      }
    });
  } catch (error) {
    logger.error('Bulk user deletion error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// =============================================================================
// DOCUMENTATION AND HEALTH
// =============================================================================

// Admin API documentation
router.get("/docs", auth, requireAdmin, (req, res) => {
  const documentation = {
    message: "JobFinder Admin API Documentation",
    version: "2.0.0",
    lastUpdated: "2025-06-02",
    security: {
      authentication: "x-auth-token header required",
      authorization: "Admin role (isAdmin: true) required",
      selfProtection: "Admins cannot delete/deactivate themselves"
    },
    userManagement: {
      endpoints: [
        "GET /api/admin/users - Get all users",
        "PUT /api/admin/users/:id/role - Update user role", 
        "PUT /api/admin/users/:id/status - Toggle user active status",
        "DELETE /api/admin/users/:id - Delete user with file cleanup",
        "DELETE /api/admin/users/bulk - Bulk delete users"
      ],
      userDeletion: {
        description: "Comprehensive user deletion with file cleanup",
        features: [
          "Deletes profile pictures and resumes from filesystem",
          "Removes user from job applications", 
          "Deletes job posts if user is recruiter",
          "Removes user from other users' saved jobs",
          "Provides detailed deletion report",
          "Comprehensive logging for audit trail"
        ],
        restrictions: [
          "Admin privileges required",
          "Cannot delete own account",
          "Cannot delete other admin users (bulk only)"
        ]
      }
    },
    jobManagement: {
      endpoints: [
        "GET /api/admin/jobs - Get all jobs",
        "GET /api/admin/jobs/statistics - Get job statistics",
        "PUT /api/admin/jobs/:id - Update job",
        "PUT /api/admin/jobs/:id/status - Toggle job status",
        "DELETE /api/admin/jobs/:id - Delete job",
        "DELETE /api/admin/jobs/bulk - Bulk delete jobs",
        "GET /api/admin/jobs/:id/applications - Get job applications"
      ]
    },
    systemManagement: {
      endpoints: [
        "GET /api/admin/stats - Get system statistics",
        "GET /api/admin/docs - This documentation",
        "GET /api/admin/health - Health check"
      ]
    },
    logging: {
      description: "All admin actions are logged with:",
      details: [
        "Admin user ID and email",
        "Target user/resource information",
        "Action performed",
        "Timestamp",
        "IP address and user agent for security events"
      ]
    }
  };

  res.status(200).json(documentation);
});

// Admin health check
router.get("/health", auth, requireAdmin, (req, res) => {
  const health = {
    status: "OK",
    service: "Admin Routes", 
    timestamp: new Date().toISOString(),
    admin: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    capabilities: {
      userManagement: "active",
      jobManagement: "active", 
      systemStats: "active",
      fileCleanup: "active",
      bulkOperations: "active"
    },
    security: {
      authenticationRequired: true,
      adminPrivilegesRequired: true,
      selfProtectionEnabled: true,
      auditLoggingEnabled: true
    },
    uptime: process.uptime(),
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  };

  logger.debug('Admin health check requested', {
    adminId: req.user._id,
    email: req.user.email
  });

  res.status(200).json(health);
});

// =============================================================================
// EXISTING ROUTES (Job Management, Statistics, etc.)
// =============================================================================

// Get all jobs for admin (including inactive)
router.get("/jobs", auth, requireAdmin, async (req, res) => {
  try {
    const jobs = await getAllJobsForAdmin();
    if (jobs.error) {
      return handleError(res, jobs.status || 500, jobs.message);
    }
    return res.status(200).json(jobs);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Get system statistics
router.get("/stats", auth, requireAdmin, async (req, res) => {
  try {
    const stats = await getSystemStats();
    if (stats.error) {
      return handleError(res, stats.status || 500, stats.message);
    }
    return res.status(200).json(stats);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Get job statistics for admin dashboard
router.get("/jobs/statistics", auth, requireAdmin, async (req, res) => {
  try {
    const stats = await getJobStatistics();
    if (stats.error) {
      return handleError(res, stats.status || 500, stats.message);
    }
    return res.status(200).json(stats);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Update job (admin only)
router.put("/jobs/:id", auth, requireAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    const jobData = req.body;
    
    // Basic validation
    if (!jobData.title || !jobData.company || !jobData.description) {
      return handleError(res, 400, "Title, company, and description are required");
    }
    
    const updatedJob = await updateJobForAdmin(jobId, jobData);
    if (updatedJob.error) {
      return handleError(res, updatedJob.status || 500, updatedJob.message);
    }
    
    return res.status(200).json(updatedJob);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Toggle job status (active/inactive)
router.put("/jobs/:id/status", auth, requireAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const result = await toggleJobStatus(jobId);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Delete job (admin only)
router.delete("/jobs/:id", auth, requireAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const result = await deleteJobForAdmin(jobId);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Bulk delete jobs (admin only)
router.delete("/jobs/bulk", auth, requireAdmin, async (req, res) => {
  try {
    const { jobIds } = req.body;
    
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return handleError(res, 400, "Job IDs array is required");
    }
    
    const result = await bulkDeleteJobs(jobIds);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Get job applications for a specific job (admin only)
router.get("/jobs/:id/applications", auth, requireAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const job = await Job.findById(jobId)
      .populate({
        path: 'applicants',
        select: 'name email profession bio appliedJobs createdAt',
        options: { sort: { createdAt: -1 } }
      })
      .populate('postedBy', 'name email');
    
    if (!job) {
      return handleError(res, 404, "Job not found");
    }
    
    // Get application dates (this would require implementing an applications tracking system)
    const applicationsWithDates = job.applicants.map(applicant => ({
      ...applicant.toObject(),
      appliedAt: applicant.createdAt // Placeholder - would need proper application tracking
    }));
    
    return res.status(200).json({
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        postedBy: job.postedBy,
        createdAt: job.createdAt
      },
      applications: applicationsWithDates,
      totalApplications: job.applicants.length
    });
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

export default router;