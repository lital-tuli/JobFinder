import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;

const generateAuthToken = (user) => {
  const payload = {
    _id: user._id,
    role: user.role,
    isAdmin: user.isAdmin,
  };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};

const verifyToken = (tokenFromClient) => {
  try {
    const payload = jwt.verify(tokenFromClient, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
};

export { generateAuthToken, verifyToken };