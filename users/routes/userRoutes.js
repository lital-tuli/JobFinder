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

const router = express.Router();

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
    
    return res.status(201).json(result);
  } catch (error) {
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
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Get user profile
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id;
    
    // Only allow users to access their own profile or admin to access any profile
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to access this profile");
    }
    
    const user = await getUserById(id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }
    
    return res.status(200).json(user);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Update user
router.put("/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user._id;
      
      // Only allow users to update their own profile or admin to update any profile
      if (id !== requestingUserId && !req.user.isAdmin) {
        return handleError(res, 403, "Not authorized to update this profile");
      }
      
      const updatedUser = await updateUser(id, req.body);
      if (updatedUser.error) {
        return handleError(res, updatedUser.status || 500, updatedUser.message);
      }
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      return handleError(res, error.status || 500, error.message);
    }
  });
  
  // Get saved jobs
  router.get("/:id/saved-jobs", auth, async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user._id;
      
      // Only allow users to access their own saved jobs
      if (id !== requestingUserId && !req.user.isAdmin) {
        return handleError(res, 403, "Not authorized to access these saved jobs");
      }
      
      const savedJobs = await getSavedJobs(id);
      if (savedJobs.error) {
        return handleError(res, savedJobs.status || 404, savedJobs.message);
      }
      
      return res.status(200).json(savedJobs);
    } catch (error) {
      return handleError(res, error.status || 500, error.message);
    }
  });
  
  // Get applied jobs
  router.get("/:id/applied-jobs", auth, async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user._id;
      
      // Only allow users to access their own applied jobs
      if (id !== requestingUserId && !req.user.isAdmin) {
        return handleError(res, 403, "Not authorized to access these applied jobs");
      }
      
      const appliedJobs = await getAppliedJobs(id);
      if (appliedJobs.error) {
        return handleError(res, appliedJobs.status || 404, appliedJobs.message);
      }
      
      return res.status(200).json(appliedJobs);
    } catch (error) {
      return handleError(res, error.status || 500, error.message);
    }
  });
  
  // Check if user is authenticated (protected route)
  router.get("/check-auth", auth, (req, res) => {
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        _id: req.user._id,
        role: req.user.role,
        isAdmin: req.user.isAdmin
      }
    });
  });
  
  export default router;