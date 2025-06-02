// users/routes/authRoutes.js - Authentication and Profile Management
import express from "express";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  getSavedJobs,
  getAppliedJobs
} from "../models/userAccessDataService.js";
import auth from "../../auth/authService.js";
import { handleError } from "../../utils/handleErrors.js";
import { validateRegistration, validateLogin } from "../validation/userValidationService.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

// Check authentication status
router.get("/check-auth", auth, (req, res) => {
  try {
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        _id: req.user._id,
        role: req.user.role,
        isAdmin: req.user.isAdmin,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        resume: req.user.resume
      }
    });
  } catch (error) {
    logger.error('Check auth error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Register a new user
router.post("/", async (req, res) => {
  try {
    const validationError = validateRegistration(req.body);
    if (validationError) {
      return handleError(res, 400, validationError);
    }
    
    const result = await registerUser(req.body);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    logger.info('User registered successfully', { 
      userId: result._id, 
      email: result.email,
      role: result.role 
    });
    
    return res.status(201).json({
      message: "User registered successfully",
      user: result
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const validationError = validateLogin(req.body);
    if (validationError) {
      return handleError(res, 400, validationError);
    }
    
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    
    if (result.error) {
      return handleError(res, result.status || 401, result.message);
    }
    
    logger.info('User logged in successfully', { 
      userId: result.user._id,
      email: result.user.email,
      role: result.user.role
    });
    
    return res.status(200).json({
      message: "Login successful",
      ...result
    });
  } catch (error) {
    logger.error('Login error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Logout user
router.post("/logout", auth, (req, res) => {
  try {
    logger.info('User logged out', { 
      userId: req.user._id,
      email: req.user.email
    });
    
    return res.status(200).json({
      message: "Logout successful"
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// =============================================================================
// PROFILE MANAGEMENT ROUTES
// =============================================================================

// Get user profile
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Authorization check
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to access this profile");
    }
    
    const user = await getUserById(id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }
    
    return res.status(200).json({
      message: "Profile retrieved successfully",
      user
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Update user profile
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Authorization check
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to update this profile");
    }
    
    // Don't allow role changes unless admin
    if (req.body.role && !req.user.isAdmin) {
      delete req.body.role;
    }
    
    // Prevent admins from removing their own admin role
    if (req.body.role && req.user.isAdmin && id === requestingUserId && req.body.role !== 'admin') {
      return handleError(res, 400, "Cannot remove your own admin privileges");
    }
    
    const updatedUser = await updateUser(id, req.body);
    if (updatedUser.error) {
      return handleError(res, updatedUser.status || 500, updatedUser.message);
    }
    
    logger.info('User profile updated successfully', { 
      userId: id,
      updatedBy: requestingUserId,
      isAdminUpdate: req.user.isAdmin && id !== requestingUserId
    });
    
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get current user's profile (convenience route)
router.get("/profile/me", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }
    
    return res.status(200).json({
      message: "Profile retrieved successfully",
      user
    });
  } catch (error) {
    logger.error('Get current user profile error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Update current user's profile (convenience route)
router.put("/profile/me", auth, async (req, res) => {
  try {
    // Don't allow role changes through this endpoint
    if (req.body.role && !req.user.isAdmin) {
      delete req.body.role;
    }
    
    const updatedUser = await updateUser(req.user._id, req.body);
    if (updatedUser.error) {
      return handleError(res, updatedUser.status || 500, updatedUser.message);
    }
    
    logger.info('User profile updated successfully', { 
      userId: req.user._id
    });
    
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update current user profile error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// =============================================================================
// JOB MANAGEMENT ROUTES
// =============================================================================

// Get saved jobs
router.get("/:id/saved-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to access these saved jobs");
    }
    
    const savedJobs = await getSavedJobs(id);
    if (savedJobs.error) {
      return handleError(res, savedJobs.status || 404, savedJobs.message);
    }
    
    return res.status(200).json({
      message: "Saved jobs retrieved successfully",
      count: savedJobs.length,
      savedJobs
    });
  } catch (error) {
    logger.error('Get saved jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get applied jobs
router.get("/:id/applied-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to access these applied jobs");
    }
    
    const appliedJobs = await getAppliedJobs(id);
    if (appliedJobs.error) {
      return handleError(res, appliedJobs.status || 404, appliedJobs.message);
    }
    
    return res.status(200).json({
      message: "Applied jobs retrieved successfully",
      count: appliedJobs.length,
      appliedJobs
    });
  } catch (error) {
    logger.error('Get applied jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get current user's saved jobs (convenience route)
router.get("/jobs/saved", auth, async (req, res) => {
  try {
    const savedJobs = await getSavedJobs(req.user._id);
    if (savedJobs.error) {
      return handleError(res, savedJobs.status || 404, savedJobs.message);
    }
    
    return res.status(200).json({
      message: "Saved jobs retrieved successfully",
      count: savedJobs.length,
      savedJobs
    });
  } catch (error) {
    logger.error('Get saved jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get current user's applied jobs (convenience route)
router.get("/jobs/applied", auth, async (req, res) => {
  try {
    const appliedJobs = await getAppliedJobs(req.user._id);
    if (appliedJobs.error) {
      return handleError(res, appliedJobs.status || 404, appliedJobs.message);
    }
    
    return res.status(200).json({
      message: "Applied jobs retrieved successfully",
      count: appliedJobs.length,
      appliedJobs
    });
  } catch (error) {
    logger.error('Get applied jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get job activity summary
router.get("/jobs/activity", auth, async (req, res) => {
  try {
    const [savedJobs, appliedJobs] = await Promise.all([
      getSavedJobs(req.user._id),
      getAppliedJobs(req.user._id)
    ]);

    if (savedJobs.error || appliedJobs.error) {
      return handleError(res, 500, "Failed to retrieve job activity");
    }

    // Calculate activity metrics
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentlyApplied = appliedJobs.filter(job => 
      new Date(job.createdAt) >= lastWeek
    ).length;

    const recentlySaved = savedJobs.filter(job => 
      new Date(job.createdAt) >= lastWeek
    ).length;

    const monthlyApplications = appliedJobs.filter(job => 
      new Date(job.createdAt) >= lastMonth
    ).length;

    const activity = {
      summary: {
        totalSaved: savedJobs.length,
        totalApplied: appliedJobs.length,
        recentlyApplied,
        recentlySaved,
        monthlyApplications
      },
      recentActivity: {
        savedThisWeek: recentlySaved,
        appliedThisWeek: recentlyApplied,
        appliedThisMonth: monthlyApplications
      },
      trends: {
        averageApplicationsPerWeek: monthlyApplications / 4,
        applicationSuccessRate: 0 // This would need to be calculated based on job application outcomes
      }
    };

    return res.status(200).json({
      message: "Job activity retrieved successfully",
      activity
    });
  } catch (error) {
    logger.error('Get job activity error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

export default router;