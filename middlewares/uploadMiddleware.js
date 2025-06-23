import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// UPLOAD DIRECTORIES SETUP
// =============================================================================

const createUploadDirs = () => {
  const uploadDirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'profiles'),
    path.join(__dirname, '..', 'uploads', 'resumes')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
};

// Initialize upload directories
createUploadDirs();

// =============================================================================
// MULTER STORAGE CONFIGURATION
// =============================================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    switch (file.fieldname) {
      case 'profilePicture':
      case 'avatar':
        uploadPath = path.join(__dirname, '..', 'uploads', 'profiles');
        break;
      case 'resume':
        uploadPath = path.join(__dirname, '..', 'uploads', 'resumes');
        break;
      default:
        uploadPath = path.join(__dirname, '..', 'uploads');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    
    cb(null, `${file.fieldname}-${uniqueSuffix}-${nameWithoutExt}${extension}`);
  }
});

// =============================================================================
// FILE FILTER CONFIGURATION
// =============================================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    profilePicture: {
      mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    avatar: {
      mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    resume: {
      mimes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      extensions: ['.pdf', '.doc', '.docx'],
      maxSize: 10 * 1024 * 1024 // 10MB
    }
  };

  const fileType = allowedTypes[file.fieldname];
  if (!fileType) {
    logger.warn('Upload attempt with invalid field name', {
      fieldname: file.fieldname,
      originalname: file.originalname
    });
    return cb(new Error(`Invalid field name: ${file.fieldname}`));
  }

  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Check MIME type
  if (!fileType.mimes.includes(file.mimetype)) {
    logger.warn('Upload attempt with invalid MIME type', {
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    return cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${fileType.mimes.join(', ')}`));
  }

  // Check file extension
  if (!fileType.extensions.includes(fileExt)) {
    logger.warn('Upload attempt with invalid extension', {
      fieldname: file.fieldname,
      extension: fileExt,
      originalname: file.originalname
    });
    return cb(new Error(`Invalid file extension for ${file.fieldname}. Allowed: ${fileType.extensions.join(', ')}`));
  }

  cb(null, true);
};

// =============================================================================
// MULTER CONFIGURATION
// =============================================================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1, // Only allow 1 file per upload
    fields: 5 // Limit number of non-file fields
  }
});

// =============================================================================
// UPLOAD MIDDLEWARE FUNCTIONS
// =============================================================================

// Profile picture upload middleware
export const uploadProfilePicture = upload.single('profilePicture');

// Resume upload middleware
export const uploadResume = upload.single('resume');

// Avatar upload middleware (alias for profile picture)
export const uploadAvatar = upload.single('avatar');

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

export const handleUploadError = (error, req, res, next) => {
  logger.error('File upload error:', {
    error: error.message,
    code: error.code,
    field: error.field,
    storageErrors: error.storageErrors
  });

  // Handle specific multer errors
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          message: 'File too large. Maximum size allowed is 10MB.',
          error: 'FILE_TOO_LARGE'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          message: 'Too many files. Only 1 file allowed per upload.',
          error: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          message: `Unexpected field: ${error.field}`,
          error: 'UNEXPECTED_FIELD'
        });
      
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          message: 'Too many parts in multipart form.',
          error: 'TOO_MANY_PARTS'
        });
      
      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          message: 'Field name too long.',
          error: 'FIELD_NAME_TOO_LONG'
        });
      
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          message: 'Field value too long.',
          error: 'FIELD_VALUE_TOO_LONG'
        });
      
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          message: 'Too many fields.',
          error: 'TOO_MANY_FIELDS'
        });
      
      default:
        return res.status(400).json({
          message: 'Upload error occurred.',
          error: 'UPLOAD_ERROR'
        });
    }
  }

  // Handle custom file validation errors
  if (error.message.includes('Invalid file type') || 
      error.message.includes('Invalid file extension') ||
      error.message.includes('Invalid field name')) {
    return res.status(400).json({
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  // Handle other errors
  return res.status(500).json({
    message: 'Internal server error during file upload.',
    error: 'INTERNAL_ERROR'
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Clean up old files (utility function)
export const cleanupOldFile = (filePath) => {
  if (!filePath) return;
  
  try {
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(__dirname, '..', filePath);
      
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`Cleaned up old file: ${filePath}`);
    }
  } catch (error) {
    logger.error('Error cleaning up old file:', {
      filePath,
      error: error.message
    });
  }
};

// Get file info utility
export const getFileInfo = (filePath) => {
  if (!filePath) return null;
  
  try {
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(__dirname, '..', filePath);
      
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(filePath)
      };
    }
  } catch (error) {
    logger.error('Error getting file info:', {
      filePath,
      error: error.message
    });
  }
  
  return { exists: false };
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  uploadProfilePicture,
  uploadResume,
  uploadAvatar,
  handleUploadError,
  cleanupOldFile,
  getFileInfo
};