import express from "express";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  getSavedJobs,
  getAppliedJobs
} from "../models/userAccessDataService.js";
import auth from "../../auth/authService.js";
import { handleError } from "../../utils/handleErrors.js";
import { validateRegistration, validateLogin } from "../validation/userValidationService.js";
import multer from 'multer';


const router = express.Router();

// Check authentication status (this should be first, before the /:id route)
router.get("/check-auth", auth, (req, res) => {
  try {
    // Return the authenticated user info
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        _id: req.user._id,
        role: req.user.role,
        isAdmin: req.user.isAdmin,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Check auth error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Register a new user
router.post("/", async (req, res) => {
  try {
    const validationError = validateRegistration(req.body);
    if (validationError) {
      return handleError(res, 400, validationError);
    }
    
    const result = await registerUser(req.body);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const validationError = validateLogin(req.body);
    if (validationError) {
      return handleError(res, 400, validationError);
    }
    
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    
    if (result.error) {
      return handleError(res, result.status || 401, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get user profile
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id; // Now guaranteed to be string
    
    // Only allow users to access their own profile or admin to access any profile
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to access this profile");
    }
    
    const user = await getUserById(id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Update user
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id; // Now guaranteed to be string
    
    // Only allow users to update their own profile or admin to update any profile
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to update this profile");
    }
    
    const updatedUser = await updateUser(id, req.body);
    if (updatedUser.error) {
      return handleError(res, updatedUser.status || 500, updatedUser.message);
    }
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get saved jobs
router.get("/:id/saved-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id; // Now guaranteed to be string
    
    // Only allow users to access their own saved jobs
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to access these saved jobs");
    }
    
    const savedJobs = await getSavedJobs(id);
    if (savedJobs.error) {
      return handleError(res, savedJobs.status || 404, savedJobs.message);
    }
    
    return res.status(200).json(savedJobs);
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get applied jobs
router.get("/:id/applied-jobs", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id; // Now guaranteed to be string
    
    // Only allow users to access their own applied jobs
    if (id !== requestingUserId && !req.user.isAdmin) {
      return handleError(res, 403, "Not authorized to access these applied jobs");
    }
    
    const appliedJobs = await getAppliedJobs(id);
    if (appliedJobs.error) {
      return handleError(res, appliedJobs.status || 404, appliedJobs.message);
    }
    
    return res.status(200).json(appliedJobs);
  } catch (error) {
    console.error('Get applied jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user.id, {
      profilePicture: imageUrl
    });

    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

export default router;