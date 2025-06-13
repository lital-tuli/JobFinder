import { createError, handleError } from "../utils/handleErrors.js";
import logger from "../utils/logger.js";

const validateRecruiter = (req, res, next) => {
  try {
    if (req.user.role !== "recruiter") {
      const error = new Error("Authorization Error: Only recruiters can create job listings");
      error.status = 403;
      throw error;
    }
    next();
  } catch (error) {
    const errorObj = new Error(error.message);
    errorObj.status = error.status || 403;
    return createError("Authorization", errorObj);
  }
};

export const requireRecruiter = (req, res, next) => {
  try {
    // Allow both recruiters and admins
    if (req.user.role !== 'recruiter' && !req.user.isAdmin) {
      logger.warn('Non-recruiter user attempted to access recruiter route', {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        endpoint: req.path
      });
      
      return handleError(res, 403, "Access denied. Recruiter or admin privileges required.");
    }
    
    logger.debug('Recruiter access granted', {
      userId: req.user._id,
      role: req.user.role,
      endpoint: req.path
    });
    
    next();
  } catch (error) {
    logger.error('Recruiter auth error:', error);
    return handleError(res, error.status || 403, error.message);
  }
};

// NEW: Job seeker validation middleware
export const requireJobSeeker = (req, res, next) => {
  try {
    if (req.user.role !== 'jobseeker' && !req.user.isAdmin) {
      logger.warn('Non-jobseeker attempted to access jobseeker route', {
        userId: req.user._id,
        role: req.user.role,
        endpoint: req.path
      });
      
      return handleError(res, 403, "Access denied. Job seeker privileges required.");
    }
    
    next();
  } catch (error) {
    logger.error('Job seeker auth error:', error);
    return handleError(res, error.status || 403, error.message);
  }
};

// NEW: Admin validation middleware (moved from adminRoutes.js)
export const requireAdmin = (req, res, next) => {
  try {
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
  } catch (error) {
    logger.error('Admin auth error:', error);
    return handleError(res, error.status || 403, error.message);
  }
};

// NEW: Enhanced admin middleware with logging
export const requireAdminWithLogging = (req, res, next) => {
  try {
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
  } catch (error) {
    logger.error('Admin auth error:', error);
    return handleError(res, error.status || 403, error.message);
  }
};

// Export the original function as default for backward compatibility
export default validateRecruiter;