import jwt from "jsonwebtoken";
import User from "../DB/models/User.js";
import logger from "../utils/logger.js";
import { handleError } from "../utils/handleErrors.js";

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET || 'your-super-secret-key-change-this-in-production';

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      logger.warn('Access attempt without token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
      return handleError(res, 401, 'Access denied. No token provided.');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, SECRET_KEY);
      
      // Get user from database
      const user = await User.findById(decoded.userId || decoded._id).select('-password');
      
      if (!user) {
        logger.warn('Token verification failed - user not found', {
          userId: decoded.userId || decoded._id,
          endpoint: req.path
        });
        return handleError(res, 401, 'Token is not valid. User not found.');
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn('Token verification failed - user inactive', {
          userId: user._id,
          endpoint: req.path
        });
        return handleError(res, 401, 'Account is deactivated. Please contact support.');
      }

      // Add user to request object
      req.user = {
        _id: user._id,
        userId: user._id, // For backward compatibility
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin || user.role === 'admin'
      };
      
      logger.debug('User authenticated successfully', {
        userId: user._id,
        email: user.email,
        role: user.role,
        endpoint: req.path
      });

      next();
    } catch (jwtError) {
      logger.error('JWT verification error:', jwtError);
      
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return handleError(res, 401, 'Token has expired. Please login again.');
      } else if (jwtError.name === 'JsonWebTokenError') {
        return handleError(res, 401, 'Invalid token format.');
      } else if (jwtError.name === 'NotBeforeError') {
        return handleError(res, 401, 'Token not active yet.');
      } else {
        return handleError(res, 401, 'Token verification failed.');
      }
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return handleError(res, 500, 'Internal server error during authentication.');
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.userId || decoded._id).select('-password');
    
    if (user && user.isActive) {
      req.user = {
        _id: user._id,
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin || user.role === 'admin'
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  
  next();
};

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    userId: user._id,
    _id: user._id, // For backward compatibility
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin || user.role === 'admin'
  };

  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: '24h',
    algorithm: 'HS256',
    issuer: 'jobfinder-app',
    audience: 'jobfinder-users'
  });
};

// Verify token utility
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY, {
      algorithms: ['HS256'],
      issuer: 'jobfinder-app',
      audience: 'jobfinder-users'
    });
  } catch (error) {
    logger.error('Token verification utility error:', error);
    return null;
  }
};

export default auth;