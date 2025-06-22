import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../../utils/logger.js";

dotenv.config();
const SECRET_KEY = process.env.SECRET || 'your-super-secret-key-change-this-in-production';

const generateAuthToken = (user) => {
  const payload = {
    _id: user._id,
    role: user.role,
    isAdmin: user.isAdmin,
    name: user.name,
    iat: Math.floor(Date.now() / 1000) // Add issued at time
  };
  
  logger.auth('token generated', user._id, { role: user.role });
  
  return jwt.sign(payload, SECRET_KEY, { 
    expiresIn: '24h',
    algorithm: 'HS256', // Specify algorithm
    issuer: 'jobfinder-app', // Add issuer
    audience: 'jobfinder-users' // Add audience
  });
};

const verifyToken = (tokenFromClient) => {
  try {
    const payload = jwt.verify(tokenFromClient, SECRET_KEY, {
      algorithms: ['HS256'], // Only allow specific algorithm
      issuer: 'jobfinder-app',
      audience: 'jobfinder-users'
    });
    
    return payload;
  } catch (error) {
    logger.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired for user', { expiredAt: error.expiredAt });
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token format');
    } else if (error.name === 'NotBeforeError') {
      logger.warn('Token not active yet');
    }
    
    return null;
  }
};

export { generateAuthToken, verifyToken };