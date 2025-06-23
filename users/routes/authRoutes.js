import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../DB/models/User.js";
import auth from "../../auth/auth.js";
import logger from "../../utils/logger.js";
import { validateUser, validateLogin } from "../validation/userValidation.js";

const router = express.Router();

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

// Register new user
// POST /api/users/
router.post("/", async (req, res) => {
  try {
    // Validate input
    const { error } = validateUser(req.body);
    if (error) {
      logger.warn('User registration validation failed', { 
        errors: error.details.map(err => err.message),
        email: req.body.email
      });
      return res.status(400).json({ 
        message: error.details[0].message 
      });
    }

    const { name, email, password, role = "jobSeeker" } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      isActive: true
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    logger.info('User registered successfully', { 
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role
    });

    // Return success response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    logger.error('User registration error:', error);
    res.status(500).json({ 
      message: "Server error during registration. Please try again." 
    });
  }
});

// User login
// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn('Login validation failed', { 
        email: req.body.email,
        error: error.details[0].message
      });
      return res.status(400).json({ 
        message: error.details[0].message 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login attempt with inactive account', { 
        email, 
        userId: user._id 
      });
      return res.status(401).json({ 
        message: "Account is deactivated. Please contact support." 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with incorrect password', { 
        email,
        userId: user._id
      });
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    logger.info('User logged in successfully', { 
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Return success response
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      message: "Server error during login. Please try again." 
    });
  }
});

// Check authentication status
// GET /api/users/check-auth
router.get("/check-auth", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      logger.warn('Auth check failed - user not found', { 
        userId: req.user.userId 
      });
      return res.status(401).json({ 
        message: "User not found" 
      });
    }

    if (!user.isActive) {
      logger.warn('Auth check failed - user inactive', { 
        userId: req.user.userId 
      });
      return res.status(401).json({ 
        message: "Account is deactivated" 
      });
    }

    res.json({
      isAuthenticated: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    logger.error('Auth check error:', error);
    res.status(500).json({ 
      message: "Server error during authentication check" 
    });
  }
});

// User logout
// POST /api/users/logout
router.post("/logout", auth, async (req, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the token
    // For now, we'll just send a success response
    logger.info('User logged out', { 
      userId: req.user.userId 
    });

    res.json({ 
      message: "Logged out successfully" 
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      message: "Server error during logout" 
    });
  }
});

// =============================================================================
// PROFILE ROUTES
// =============================================================================

// Get user profile by ID
// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ 
      message: "Server error while fetching user profile" 
    });
  }
});

// Update user profile
// PUT /api/users/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user can update this profile
    if (req.user.userId !== userId && req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. You can only update your own profile." 
      });
    }

    const allowedUpdates = ['name', 'bio', 'location', 'skills', 'phone'];
    const updates = {};
    
    // Filter allowed updates
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        message: "No valid fields to update" 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    logger.info('User profile updated', { 
      userId,
      updatedFields: Object.keys(updates)
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        profilePicture: user.profilePicture,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ 
      message: "Server error while updating profile" 
    });
  }
});

// Get current user profile
// GET /api/users/profile/me
router.get("/profile/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        profilePicture: user.profilePicture,
        phone: user.phone,
        resume: user.resume,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    logger.error('Get current user profile error:', error);
    res.status(500).json({ 
      message: "Server error while fetching profile" 
    });
  }
});

// Update current user profile
// PUT /api/users/profile/me
router.put("/profile/me", auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'bio', 'location', 'skills', 'phone'];
    const updates = {};
    
    // Filter allowed updates
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        message: "No valid fields to update" 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { ...updates, updatedAt: new Date() },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    logger.info('Current user profile updated', { 
      userId: req.user.userId,
      updatedFields: Object.keys(updates)
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        profilePicture: user.profilePicture,
        phone: user.phone,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    logger.error('Update current user profile error:', error);
    res.status(500).json({ 
      message: "Server error while updating profile" 
    });
  }
});

export default router;