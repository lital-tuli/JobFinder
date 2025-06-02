import fs from 'fs';
import path from 'path';
import User from '../DB/models/User.js';
import logger from './logger.js';

export const cleanupOrphanedFiles = async () => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const profilesDir = path.join(uploadsDir, 'profiles');
    const resumesDir = path.join(uploadsDir, 'resumes');

    // Get all users with files
    const users = await User.find({
      $or: [
        { profilePicture: { $exists: true, $ne: null } },
        { resume: { $exists: true, $ne: null } }
      ]
    }).select('profilePicture resume');

    const userFiles = new Set();
    users.forEach(user => {
      if (user.profilePicture) {
        userFiles.add(path.basename(user.profilePicture));
      }
      if (user.resume) {
        userFiles.add(path.basename(user.resume));
      }
    });

    // Check profile pictures directory
    if (fs.existsSync(profilesDir)) {
      const profileFiles = fs.readdirSync(profilesDir);
      profileFiles.forEach(file => {
        if (!userFiles.has(file)) {
          const filePath = path.join(profilesDir, file);
          fs.unlinkSync(filePath);
          logger.info(`Deleted orphaned profile picture: ${file}`);
        }
      });
    }

    // Check resumes directory
    if (fs.existsSync(resumesDir)) {
      const resumeFiles = fs.readdirSync(resumesDir);
      resumeFiles.forEach(file => {
        if (!userFiles.has(file)) {
          const filePath = path.join(resumesDir, file);
          fs.unlinkSync(filePath);
          logger.info(`Deleted orphaned resume: ${file}`);
        }
      });
    }

    logger.info('File cleanup completed successfully');
  } catch (error) {
    logger.error('File cleanup failed:', error);
  }
};

// Run cleanup weekly
setInterval(cleanupOrphanedFiles, 7 * 24 * 60 * 60 * 1000);