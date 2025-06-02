import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { uploadProfilePicture, uploadResume, handleUploadError } from "../../middlewares/uploadMiddleware.js";
import { updateUser, getUserById } from "../models/userAccessDataService.js";
import { validateFile } from "../../services/fileValidationService.js";
import auth from "../../auth/authService.js";
import { handleError } from "../../utils/handleErrors.js";
import logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// =============================================================================
// PROFILE PICTURE ROUTES
// =============================================================================

// Upload profile picture
router.post("/profile/picture", auth, (req, res) => {
  uploadProfilePicture(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, () => {});
    }

    try {
      if (!req.file) {
        return handleError(res, 400, "No profile picture uploaded");
      }

      // Validate file
      const validationErrors = validateFile(req.file, 'profilePicture');
      if (validationErrors.length > 0) {
        // Delete uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return handleError(res, 400, validationErrors.join(', '));
      }

      // Delete old profile picture if exists
      const user = await getUserById(req.user._id);
      if (user.profilePicture) {
        const oldPicturePath = path.join(__dirname, '..', '..', user.profilePicture);
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
          logger.info(`Deleted old profile picture: ${user.profilePicture}`);
        }
      }

      // Update user with new profile picture path
      const relativePath = path.relative(path.join(__dirname, '..', '..'), req.file.path);
      const updatedUser = await updateUser(req.user._id, {
        profilePicture: relativePath.replace(/\\/g, '/')
      });

      if (updatedUser.error) {
        // Delete uploaded file if database update fails
        fs.unlinkSync(req.file.path);
        return handleError(res, updatedUser.status || 500, updatedUser.message);
      }

      logger.info('Profile picture uploaded successfully', {
        userId: req.user._id,
        filename: req.file.filename
      });

      return res.status(200).json({
        message: "Profile picture uploaded successfully",
        profilePicture: relativePath.replace(/\\/g, '/'),
        user: updatedUser
      });
    } catch (error) {
      // Delete uploaded file if there's an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      logger.error('Profile picture upload error:', error);
      return handleError(res, error.status || 500, error.message);
    }
  });
});

// Delete profile picture
router.delete("/profile/picture", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }

    if (!user.profilePicture) {
      return handleError(res, 404, "No profile picture to delete");
    }

    // Delete file from filesystem
    const picturePath = path.join(__dirname, '..', '..', user.profilePicture);
    if (fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath);
      logger.info(`Deleted profile picture: ${user.profilePicture}`);
    }

    // Update user record
    const updatedUser = await updateUser(req.user._id, {
      profilePicture: null
    });

    if (updatedUser.error) {
      return handleError(res, updatedUser.status || 500, updatedUser.message);
    }

    return res.status(200).json({
      message: "Profile picture deleted successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error('Profile picture deletion error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// =============================================================================
// RESUME ROUTES
// =============================================================================

// Upload resume
router.post("/profile/resume", auth, (req, res) => {
  uploadResume(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, () => {});
    }

    try {
      if (!req.file) {
        return handleError(res, 400, "No resume uploaded");
      }

      // Validate file
      const validationErrors = validateFile(req.file, 'resume');
      if (validationErrors.length > 0) {
        // Delete uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return handleError(res, 400, validationErrors.join(', '));
      }

      // Delete old resume if exists
      const user = await getUserById(req.user._id);
      if (user.resume) {
        const oldResumePath = path.join(__dirname, '..', '..', user.resume);
        if (fs.existsSync(oldResumePath)) {
          fs.unlinkSync(oldResumePath);
          logger.info(`Deleted old resume: ${user.resume}`);
        }
      }

      // Update user with new resume path
      const relativePath = path.relative(path.join(__dirname, '..', '..'), req.file.path);
      const updatedUser = await updateUser(req.user._id, {
        resume: relativePath.replace(/\\/g, '/')
      });

      if (updatedUser.error) {
        // Delete uploaded file if database update fails
        fs.unlinkSync(req.file.path);
        return handleError(res, updatedUser.status || 500, updatedUser.message);
      }

      logger.info('Resume uploaded successfully', {
        userId: req.user._id,
        filename: req.file.filename
      });

      return res.status(200).json({
        message: "Resume uploaded successfully",
        resume: relativePath.replace(/\\/g, '/'),
        user: updatedUser
      });
    } catch (error) {
      // Delete uploaded file if there's an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      logger.error('Resume upload error:', error);
      return handleError(res, error.status || 500, error.message);
    }
  });
});

// Delete resume
router.delete("/profile/resume", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }

    if (!user.resume) {
      return handleError(res, 404, "No resume to delete");
    }

    // Delete file from filesystem
    const resumePath = path.join(__dirname, '..', '..', user.resume);
    if (fs.existsSync(resumePath)) {
      fs.unlinkSync(resumePath);
      logger.info(`Deleted resume: ${user.resume}`);
    }

    // Update user record
    const updatedUser = await updateUser(req.user._id, {
      resume: null
    });

    if (updatedUser.error) {
      return handleError(res, updatedUser.status || 500, updatedUser.message);
    }

    return res.status(200).json({
      message: "Resume deleted successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error('Resume deletion error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Download resume
router.get("/profile/resume/download", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }

    if (!user.resume) {
      return handleError(res, 404, "No resume found");
    }

    const resumePath = path.join(__dirname, '..', '..', user.resume);
    if (!fs.existsSync(resumePath)) {
      return handleError(res, 404, "Resume file not found");
    }

    // Set appropriate headers for download
    const filename = path.basename(resumePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(resumePath);
    fileStream.pipe(res);

    logger.info('Resume downloaded', {
      userId: req.user._id,
      filename: filename
    });
  } catch (error) {
    logger.error('Resume download error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// =============================================================================
// FILE INFORMATION ROUTES
// =============================================================================

// Get user's file information
router.get("/profile/files", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    if (user.error) {
      return handleError(res, user.status || 404, user.message);
    }

    const fileInfo = {
      profilePicture: {
        exists: !!user.profilePicture,
        path: user.profilePicture || null,
        url: user.profilePicture ? `/uploads/${user.profilePicture}` : null
      },
      resume: {
        exists: !!user.resume,
        path: user.resume || null,
        downloadUrl: user.resume ? `/api/users/profile/resume/download` : null
      }
    };

    return res.status(200).json({
      message: "File information retrieved successfully",
      files: fileInfo
    });
  } catch (error) {
    logger.error('Get file info error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// =============================================================================
// LEGACY ROUTES (for backward compatibility)
// =============================================================================

// Legacy profile picture upload route
router.post("/profile", auth, (req, res) => {
  uploadProfilePicture(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, () => {});
    }

    try {
      if (!req.file) {
        return handleError(res, 400, "No file uploaded");
      }

      // Delete old profile picture if exists
      const user = await getUserById(req.user._id);
      if (user.profilePicture) {
        const oldPicturePath = path.join(__dirname, '..', '..', user.profilePicture);
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
        }
      }

      // Update user with new profile picture path
      const relativePath = path.relative(path.join(__dirname, '..', '..'), req.file.path);
      const updatedUser = await updateUser(req.user._id, {
        profilePicture: relativePath.replace(/\\/g, '/')
      });

      if (updatedUser.error) {
        fs.unlinkSync(req.file.path);
        return handleError(res, updatedUser.status || 500, updatedUser.message);
      }

      logger.info('Profile picture uploaded via legacy route', {
        userId: req.user._id,
        filename: req.file.filename
      });

      return res.status(200).json({
        message: "Profile picture uploaded successfully",
        profilePicture: relativePath.replace(/\\/g, '/'),
        user: updatedUser
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      logger.error('Legacy profile upload error:', error);
      return handleError(res, error.status || 500, error.message);
    }
  });
});

export default router;