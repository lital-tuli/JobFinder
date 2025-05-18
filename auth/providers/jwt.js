import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};

const verifyToken = (tokenFromClient) => {
  try {
    const payload = jwt.verify(tokenFromClient, SECRET_KEY);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

export { generateAuthToken, verifyToken };