import { createError, handleError } from "../utils/handleErrors.js";
import { verifyToken } from "./providers/jwt.js";
import logger from "../utils/logger.js";

const auth = (req, res, next) => {
  try {
    const tokenFromClient = 
      req.header("x-auth-token") || 
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!tokenFromClient) {
      const error = new Error('Authentication required - no token provided');
      error.status = 401;
      throw error;
    }

    const userInfo = verifyToken(tokenFromClient);
    if (!userInfo) {
      const error = new Error("Invalid or expired token");
      error.status = 401;
      throw error;
    }

    const now = Math.floor(Date.now() / 1000);
    if (userInfo.exp && userInfo.exp < now) {
      const error = new Error("Token has expired");
      error.status = 401;
      throw error;
    }

    if (!userInfo._id || !userInfo.role) {
      const error = new Error("Invalid token payload");
      error.status = 401;
      throw error;
    }

    // Ensure _id is always a string for consistent comparison
    req.user = {
      ...userInfo,
      _id: userInfo._id.toString(),
      isAdmin: userInfo.isAdmin || false
    };
    
    logger.auth('user authenticated', userInfo._id, { 
      role: userInfo.role,
      isAdmin: userInfo.isAdmin,
      endpoint: req.path
    });
    
    return next();
  } catch (error) {
    logger.error('Authentication error:', {
      message: error.message,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return handleError(res, error.status || 401, error.message);
  }
};

export default auth;