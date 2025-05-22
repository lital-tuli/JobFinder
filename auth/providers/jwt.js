import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../../utils/logger.js";

dotenv.config();
const SECRET_KEY = process.env.SECRET || 'secret';

const generateAuthToken = (user) => {
  const payload = {
    _id: user._id,
    role: user.role,
    isAdmin: user.isAdmin,
    name: user.name,
    email: user.email
  };
  
  logger.auth('token generated', user._id, { role: user.role });
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};

const verifyToken = (tokenFromClient) => {
  try {
    const payload = jwt.verify(tokenFromClient, SECRET_KEY);
    return payload;
  } catch (error) {
    logger.error('Token verification error:', error);
    return null;
  }
};

export { generateAuthToken, verifyToken };