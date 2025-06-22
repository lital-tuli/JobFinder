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

router.post("/login", async (req, res) => {
  try {
    // Validate input
    const validationError = validateLogin(req.body);
    if (validationError) {
      logger.warn('Login validation failed', { 
        email: req.body.email,
        error: validationError,
        ip: req.ip
      });
      handleError(res, 400, validationError);
      return;
    }
    
    const { email, password } = req.body;
    
    // Attempt login
    const result = await loginUser(email, password);
    
    if (result.error) {
      // Log failed login attempt
      logger.warn('Failed login attempt', { 
        email, 
        reason: result.message,
        status: result.status,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      handleError(res, result.status || 401, result.message);
      return;
    }
    
    if (!result || !result.token || !result.user || !result.user._id) {
      logger.error('Login service returned incomplete data', { 
        hasResult: !!result,
        hasToken: !!(result?.token), 
        hasUser: !!(result?.user),
        hasUserId: !!(result?.user?._id),
        email,
        timestamp: new Date().toISOString()
      });
      handleError(res, 500, "Authentication failed - incomplete response. Please try again.");
      return;
    }
    
    if (!result.user.email || !result.user.role) {
      logger.error('Login service returned invalid user data', {
        hasEmail: !!result.user.email,
        hasRole: !!result.user.role,
        userId: result.user._id,
        timestamp: new Date().toISOString()
      });
      handleError(res, 500, "Authentication failed - invalid user data. Please try again.");
      return;
    }
    
    // Success - only reach here if everything is valid
    logger.info('User logged in successfully', { 
      userId: result.user._id,
      email: result.user.email,
      role: result.user.role,
      isAdmin: result.user.isAdmin,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user
    });
    
  } catch (error) {
    logger.error('Login route error:', {
      message: error.message,
      stack: error.stack,
      email: req.body?.email,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    handleError(res, error.status || 500, error.message || "Internal server error during login");
  }
});

// Logout user
router.post("/logout", auth, (req, res) => {
  try {
    logger.info('User logged out', { 
      userId: req.user._id,
      role: req.user.role,
      ip: req.ip,
      timestamp: new Date().toISOString()
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
    
    const result = await updateUser(id, req.body);
    if (result.error) {
      handleError(res, result.status || 400, result.message);
      return;
    }
    
    logger.info('User profile updated', { 
      userId: id,
      updatedBy: requestingUserId
    });
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: result
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Get user's saved jobs
router.get("/:id/saved-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Authorization check
    if (id !== requestingUserId && !req.user.isAdmin) {
      handleError(res, 403, "Not authorized to access saved jobs");
      return;
    }
    
    const savedJobs = await getSavedJobs(id);
    if (savedJobs.error) {
      handleError(res, savedJobs.status || 404, savedJobs.message);
      return;
    }
    
    res.status(200).json({
      message: "Saved jobs retrieved successfully",
      savedJobs
    });
  } catch (error) {
    logger.error('Get saved jobs error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

// Get user's job applications
router.get("/:id/applied-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Authorization check
    if (id !== requestingUserId && !req.user.isAdmin) {
      handleError(res, 403, "Not authorized to access job applications");
      return;
    }
    
    const appliedJobs = await getAppliedJobs(id);
    if (appliedJobs.error) {
      handleError(res, appliedJobs.status || 404, appliedJobs.message);
      return;
    }
    
    res.status(200).json({
      message: "Applied jobs retrieved successfully",
      appliedJobs
    });
  } catch (error) {
    logger.error('Get applied jobs error:', error);
    handleError(res, error.status || 500, error.message);
  }
});

export default router;