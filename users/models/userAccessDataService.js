import User from "../../DB/models/User.js";
import { generateAuthToken } from "../../auth/providers/jwt.js";
import { createError } from "../../utils/handleErrors.js";
import { generatePassword, comparePasswords } from "../helpers/bcrypt.js";

// =============================================================================
// USER AUTHENTICATION FUNCTIONS
// =============================================================================

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
      profession: user.profession,
      bio: user.bio,
      isAdmin: user.isAdmin
    };
    
    return userToReturn;
  } catch (error) {
    // Don't use 'return' here - just pass the error back
    const status = error.status || 500;
    throw createError("Registration", error, status);
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
    
    // Return token and user data (without password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profession: user.profession,
      bio: user.bio,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
      resume: user.resume
    };
    
    return { token, user: userData };
  } catch (error) {
    // Don't use 'return' here - just pass the error back
    const status = error.status || 401;
    throw createError("Authentication", error, status);
  }
};

// =============================================================================
// USER PROFILE FUNCTIONS
// =============================================================================

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
    throw createError("UserAccess", error, status);
  }
};

const updateUser = async (userId, userData) => {
  try {
    // Don't allow updating email to an existing email
    if (userData.email) {
      const existingUser = await User.findOne({ 
        email: userData.email, 
        _id: { $ne: userId } 
      });
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

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      userData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return updatedUser;
  } catch (error) {
    const status = error.status || 500;
    throw createError("UserUpdate", error, status);
  }
};

// =============================================================================
// JOB INTERACTION FUNCTIONS
// =============================================================================

const getSavedJobs = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate({
        path: 'savedJobs',
        populate: {
          path: 'company',
          select: 'name logo'
        }
      })
      .select('savedJobs');

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return user.savedJobs || [];
  } catch (error) {
    const status = error.status || 500;
    throw createError("SavedJobs", error, status);
  }
};

const getAppliedJobs = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate({
        path: 'appliedJobs.job',
        populate: {
          path: 'company',
          select: 'name logo'
        }
      })
      .select('appliedJobs');

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // Transform the data to include application details
    const appliedJobs = user.appliedJobs.map(application => ({
      job: application.job,
      appliedAt: application.appliedAt,
      status: application.status || 'pending'
    }));

    return appliedJobs || [];
  } catch (error) {
    const status = error.status || 500;
    throw createError("AppliedJobs", error, status);
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const deleteUser = async (userId) => {
  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    return { message: "User deleted successfully" };
  } catch (error) {
    const status = error.status || 500;
    throw createError("UserDeletion", error, status);
  }
};

const getAllUsers = async (query = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    // Build filter object
    const filter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { 'name.first': { $regex: search, $options: 'i' } },
        { 'name.last': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const users = await User.find(filter)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: users.length,
        totalUsers: total
      }
    };
  } catch (error) {
    const status = error.status || 500;
    throw createError("GetAllUsers", error, status);
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  getSavedJobs,
  getAppliedJobs,
  deleteUser,
  getAllUsers
};