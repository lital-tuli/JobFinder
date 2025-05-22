import { createError, handleError } from "../utils/handleErrors.js";
import { verifyToken } from "./providers/jwt.js";

const auth = (req, res, next) => {
  try {
    const tokenFromClient = req.header("x-auth-token");

    if (!tokenFromClient) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }

    const userInfo = verifyToken(tokenFromClient);
    if (!userInfo) {
      const error = new Error("Invalid token");
      error.status = 401;
      throw error;
    }

    // Ensure _id is always a string for consistent comparison
    req.user = {
      ...userInfo,
      _id: userInfo._id.toString()
    };
    
    return next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return handleError(res, error.status || 401, error.message);
  }
};

export default auth;