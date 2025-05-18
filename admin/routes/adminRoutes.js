import express from "express";
import {
  getAllUsers,
  getAllJobsForAdmin,
  updateUserRole,
  deleteUser,
  getSystemStats,
  toggleUserStatus
} from "../models/adminAccessDataService.js";
import auth from "../../auth/authService.js";
import { handleError } from "../../utils/handleErrors.js";

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return handleError(res, 403, "Access denied. Admin privileges required.");
  }
  next();
};

// Get all users (admin only)
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    if (users.error) {
      return handleError(res, users.status || 500, users.message);
    }
    return res.status(200).json(users);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

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

// Update user role
router.put("/users/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    // Prevent admin from changing their own role unless there are other admins
    if (userId === req.user._id && role !== 'admin') {
      return handleError(res, 400, "You cannot remove your own admin privileges");
    }
    
    if (!role || !['jobseeker', 'recruiter', 'admin'].includes(role)) {
      return handleError(res, 400, "Invalid role. Must be 'jobseeker', 'recruiter', or 'admin'");
    }
    
    const updatedUser = await updateUserRole(userId, role);
    if (updatedUser.error) {
      return handleError(res, updatedUser.status || 500, updatedUser.message);
    }
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Toggle user status (active/inactive)
router.put("/users/:id/status", auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deactivating themselves
    if (userId === req.user._id) {
      return handleError(res, 400, "You cannot deactivate your own account");
    }
    
    const result = await toggleUserStatus(userId);
    
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Delete user (admin only)
router.delete("/users/:id", auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (userId === req.user._id) {
      return handleError(res, 400, "Cannot delete your own account");
    }
    
    const result = await deleteUser(userId);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

export default router;