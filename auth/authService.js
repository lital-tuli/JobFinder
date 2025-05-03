import { createError, handleError } from "../utils/handleErrors.js";
import { verifyToken } from "./providers/JWT.js";

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

    req.user = userInfo;
    return next();
  } catch (error) {
    return handleError(res, error.status || 401, error.message);
  }
};

export default auth;