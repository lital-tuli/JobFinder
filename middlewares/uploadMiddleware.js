import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '..', 'uploads', 'profiles'),
    path.join(__dirname, '..', 'uploads', 'resumes')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Enhanced storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profilePicture") {
      cb(null, path.join(__dirname, '..', 'uploads', 'profiles'));
    } else if (file.fieldname === "resume") {
      cb(null, path.join(__dirname, '..', 'uploads', 'resumes'));
    } else {
      cb(new Error("Unknown fieldname for upload"), false);
    }
  },
  filename: (req, file, cb) => {
    // Include user ID in filename for better organization
    const userId = req.user._id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = file.fieldname;
    
    cb(null, `${basename}-${userId}-${timestamp}${ext}`);
  }
});

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profilePicture") {
    // Check if it's an image
    if (file.mimetype.startsWith("image/")) {
      // Additional check for allowed image types
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"), false);
      }
    } else {
      cb(new Error("Only image files are allowed for profile picture"), false);
    }
  } else if (file.fieldname === "resume") {
    // Allow PDF and Word documents for resume
    const allowedResumeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (allowedResumeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed for resume"), false);
    }
  } else {
    cb(new Error("Unknown fieldname"), false);
  }
};

// Create upload instances
export const uploadProfilePicture = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB for images
    files: 1
  },
  fileFilter,
}).single("profilePicture");

export const uploadResume = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 1
  },
  fileFilter,
}).single("resume");

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "File too large. Maximum size allowed is " + 
                (error.field === 'profilePicture' ? '5MB' : '10MB') 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: "Too many files uploaded" });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: "Unexpected field in upload" });
    }
  }
  
  if (error.message) {
    return res.status(400).json({ message: error.message });
  }
  
  next(error);
};

