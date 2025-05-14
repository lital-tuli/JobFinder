import User from "../../DB/models/User.js";
import { generateAuthToken } from "../../auth/providers/jwt.js";
import { createError } from "../../utils/handleErrors.js";
import { generatePassword, comparePasswords } from "../helpers/bcrypt.js";

const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error = new Error("User with this email already exists");
      error.status = 409;
      throw error;
    }

    // Hash password
    userData.password = generatePassword(userData.password);
    
    // Create new user
    const user = new User(userData);
    await user.save();
    
    // Return user without sensitive data
    const userToReturn = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    
    return userToReturn;
  } catch (error) {
    const status = error.status || 500;
    return createError("Registration", error, status);
  }
};

const loginUser = async (email, password) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    // Check password
    const validPassword = comparePasswords(password, user.password);
    if (!validPassword) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    // Generate token
    const token = generateAuthToken(user);
    
    return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
  } catch (error) {
    const status = error.status || 401;
    return createError("Authentication", error, status);
  }
};

const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    return user;
  } catch (error) {
    const status = error.status || 404;
    return createError("UserAccess", error, status);
  }
};

const updateUser = async (userId, userData) => {
  try {
    // Don't allow updating email to an existing email
    if (userData.email) {
      const existingUser = await User.findOne({ email: userData.email, _id: { $ne: userId } });
      if (existingUser) {
        const error = new Error("Email already in use");
        error.status = 409;
        throw error;
      }
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = generatePassword(userData.password);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      userData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return user;
  } catch (error) {
    const status = error.status || 500;
    return createError("UserUpdate", error, status);
  }
};

const getSavedJobs = async (userId) => {
  try {
    const user = await User.findById(userId).populate("savedJobs");
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    return user.savedJobs;
  } catch (error) {
    const status = error.status || 404;
    return createError("UserAccess", error, status);
  }
};

const getAppliedJobs = async (userId) => {
  try {
    const user = await User.findById(userId).populate({
      path: 'appliedJobs',
      model: 'Job'
    });
    
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    return user.appliedJobs;
  } catch (error) {
    const status = error.status || 404;
    return createError("UserAccess", error, status);
  }
};

export {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  getSavedJobs,
  getAppliedJobs
};