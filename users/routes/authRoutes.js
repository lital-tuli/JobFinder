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
    res.status(200).json({
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
    handleError(res, error.status || 500, error.message);
  }
});

// Register a new user
router.post("/", async (req, res) => {
  try {
    // Validate input
    const validationError = validateRegistration(req.body);
    if (validationError) {
      handleError(res, 400, validationError);
      return;
    }
    
    // Attempt registration
    const result = await registerUser(req.body);
    
    // Check if registration failed
    if (result.error) {
      handleError(res, result.status || 500, result.message);
      return;
    }
    
    // Success
    logger.info('User registered successfully', { 
      userId: result._id, 
      email: result.email,
      role: result.role 
    });
    
    res.status(201).json({
      message: "User registered successfully",
      user: result
    });
    
  } catch (error) {
    logger.error('Registration error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Login user - FIXED LOGIC
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const validationError = validateLogin(req.body);
    if (validationError) {
      handleError(res, 400, validationError);
      return;
    }
    
    const { email, password } = req.body;
    
    // Attempt login
    const result = await loginUser(email, password);
    
    // Check if login failed
    if (result.error) {
      handleError(res, result.status || 401, result.message);
      return;
    }
    
    // Verify we have required data
    if (!result.token || !result.user) {
      logger.error('Login service returned incomplete data', { 
        hasToken: !!result.token, 
        hasUser: !!result.user,
        email 
      });
      handleError(res, 500, "Login failed - incomplete response");
      return;
    }
    
    // Success
    logger.info('User logged in successfully', { 
      userId: result.user._id,
      email: result.user.email,
      role: result.user.role
    });
    
    res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Logout user
router.post("/logout", auth, (req, res) => {
  try {
    logger.info('User logged out', { 
      userId: req.user._id,
      email: req.user.email
    });
    
    res.status(200).json({
      message: "Logout successful"
    });
  } catch (error) {
    logger.error('Logout error:', error);
    handleError(res, error.status || 500, error.message);
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
      handleError(res, 403, "Not authorized to access this profile");
      return;
    }
    
    const user = await getUserById(id);
    if (user.error) {
      handleError(res, user.status || 404, user.message);
      return;
    }
    
    res.status(200).json({
      message: "Profile retrieved successfully",
      user
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Update user profile
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Authorization check
    if (id !== requestingUserId && !req.user.isAdmin) {
      handleError(res, 403, "Not authorized to update this profile");
      return;
    }
    
    // Don't allow role changes unless admin
    if (req.body.role && !req.user.isAdmin) {
      delete req.body.role;
    }
    
    // Prevent admins from removing their own admin role
    if (req.body.role && req.user.isAdmin && id === requestingUserId && req.body.role !== 'admin') {
      handleError(res, 400, "Cannot remove your own admin privileges");
      return;
    }
    
    const updatedUser = await updateUser(id, req.body);
    if (updatedUser.error) {
      handleError(res, updatedUser.status || 500, updatedUser.message);
      return;
    }
    
    logger.info('User profile updated successfully', { 
      userId: id,
      updatedBy: requestingUserId,
      isAdminUpdate: req.user.isAdmin && id !== requestingUserId
    });
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Get current user's profile (convenience route)
router.get("/profile/me", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    if (user.error) {
      handleError(res, user.status || 404, user.message);
      return;
    }
    
    res.status(200).json({
      message: "Profile retrieved successfully",
      user
    });
  } catch (error) {
    logger.error('Get current user profile error:', error);
    handleError(res, error.status || 500, error.message);
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
      handleError(res, updatedUser.status || 500, updatedUser.message);
      return;
    }
    
    logger.info('User profile updated successfully', { 
      userId: req.user._id
    });
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update current user profile error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// =============================================================================
// JOB INTERACTION ROUTES
// =============================================================================

// Get user's saved jobs
router.get("/:id/saved-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Authorization check
    if (id !== requestingUserId && !req.user.isAdmin) {
      handleError(res, 403, "Not authorized to access this user's saved jobs");
      return;
    }
    
    const jobs = await getSavedJobs(id);
    if (jobs.error) {
      handleError(res, jobs.status || 500, jobs.message);
      return;
    }
    
    res.status(200).json({
      message: "Saved jobs retrieved successfully",
      jobs: jobs || []
    });
  } catch (error) {
    logger.error('Get saved jobs error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Get user's applied jobs
router.get("/:id/applied-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Authorization check
    if (id !== requestingUserId && !req.user.isAdmin) {
      handleError(res, 403, "Not authorized to access this user's applied jobs");
      return;
    }
    
    const jobs = await getAppliedJobs(id);
    if (jobs.error) {
      handleError(res, jobs.status || 500, jobs.message);
      return;
    }
    
    res.status(200).json({
      message: "Applied jobs retrieved successfully",
      jobs: jobs || []
    });
  } catch (error) {
    logger.error('Get applied jobs error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Convenience routes for current user
router.get("/jobs/saved", auth, async (req, res) => {
  try {
    const jobs = await getSavedJobs(req.user._id);
    if (jobs.error) {
      handleError(res, jobs.status || 500, jobs.message);
      return;
    }
    
    res.status(200).json({
      message: "Saved jobs retrieved successfully",
      jobs: jobs || []
    });
  } catch (error) {
    logger.error('Get current user saved jobs error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

router.get("/jobs/applied", auth, async (req, res) => {
  try {
    const jobs = await getAppliedJobs(req.user._id);
    if (jobs.error) {
      handleError(res, jobs.status || 500, jobs.message);
      return;
    }
    
    res.status(200).json({
      message: "Applied jobs retrieved successfully",
      jobs: jobs || []
    });
  } catch (error) {
    logger.error('Get current user applied jobs error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

export default router;