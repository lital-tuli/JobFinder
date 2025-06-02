import fs from 'fs';
import path from 'path';
import User from '../DB/models/User.js';
import logger from './logger.js';

// Helper function to safely delete a file
const safeDeleteFile = async (filePath) => {
  try {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      return { success: true, reason: 'File does not exist' };
    }

    // Check file stats to ensure it's actually a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return { success: false, reason: 'Path is not a file' };
    }

    // Try to delete the file
    fs.unlinkSync(filePath);
    return { success: true, reason: 'File deleted successfully' };
    
  } catch (error) {
    // Handle different types of errors
    if (error.code === 'EPERM') {
      return { 
        success: false, 
        reason: 'Permission denied - file may be in use or protected',
        error: error.code 
      };
    } else if (error.code === 'ENOENT') {
      return { 
        success: true, 
        reason: 'File already deleted or does not exist',
        error: error.code 
      };
    } else if (error.code === 'EBUSY') {
      return { 
        success: false, 
        reason: 'File is busy or locked by another process',
        error: error.code 
      };
    } else {
      return { 
        success: false, 
        reason: `Unexpected error: ${error.message}`,
        error: error.code || 'UNKNOWN' 
      };
    }
  }
};

// Helper function to get safe filename from file path
const getSafeFilename = (filePath) => {
  if (!filePath) return null;
  try {
    return path.basename(filePath);
  } catch (error) {
    logger.warn(`Invalid file path: ${filePath}`);
    return null;
  }
};

export const cleanupOrphanedFiles = async () => {
  try {
    logger.info('Starting file cleanup process...');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const profilesDir = path.join(uploadsDir, 'profiles');
    const resumesDir = path.join(uploadsDir, 'resumes');

    // Ensure directories exist
    [uploadsDir, profilesDir, resumesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });

    // Get all users with files
    const users = await User.find({
      $or: [
        { profilePicture: { $exists: true, $ne: null, $ne: '' } },
        { resume: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).select('profilePicture resume');

    logger.info(`Found ${users.length} users with files`);

    // Build set of valid filenames
    const userFiles = new Set();
    users.forEach(user => {
      const profilePicture = getSafeFilename(user.profilePicture);
      const resume = getSafeFilename(user.resume);
      
      if (profilePicture) {
        userFiles.add(profilePicture);
      }
      if (resume) {
        userFiles.add(resume);
      }
    });

    logger.info(`Found ${userFiles.size} valid user files`);

    let totalDeleted = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    // Clean up profile pictures directory
    if (fs.existsSync(profilesDir)) {
      try {
        const profileFiles = fs.readdirSync(profilesDir);
        logger.info(`Checking ${profileFiles.length} files in profiles directory`);
        
        for (const file of profileFiles) {
          // Skip hidden files and system files
          if (file.startsWith('.') || file.startsWith('desktop.ini') || file.startsWith('Thumbs.db')) {
            totalSkipped++;
            continue;
          }

          if (!userFiles.has(file)) {
            const filePath = path.join(profilesDir, file);
            const result = await safeDeleteFile(filePath);
            
            if (result.success) {
              logger.info(`Deleted orphaned profile picture: ${file} (${result.reason})`);
              totalDeleted++;
            } else {
              logger.warn(`Could not delete orphaned profile picture ${file}: ${result.reason}`);
              totalErrors++;
            }
          }
        }
      } catch (error) {
        logger.error(`Error reading profiles directory: ${error.message}`);
      }
    }

    // Clean up resumes directory
    if (fs.existsSync(resumesDir)) {
      try {
        const resumeFiles = fs.readdirSync(resumesDir);
        logger.info(`Checking ${resumeFiles.length} files in resumes directory`);
        
        for (const file of resumeFiles) {
          // Skip hidden files and system files
          if (file.startsWith('.') || file.startsWith('desktop.ini') || file.startsWith('Thumbs.db')) {
            totalSkipped++;
            continue;
          }

          if (!userFiles.has(file)) {
            const filePath = path.join(resumesDir, file);
            const result = await safeDeleteFile(filePath);
            
            if (result.success) {
              logger.info(`Deleted orphaned resume: ${file} (${result.reason})`);
              totalDeleted++;
            } else {
              logger.warn(`Could not delete orphaned resume ${file}: ${result.reason}`);
              totalErrors++;
            }
          }
        }
      } catch (error) {
        logger.error(`Error reading resumes directory: ${error.message}`);
      }
    }

    // Summary
    logger.success(`File cleanup completed: ${totalDeleted} deleted, ${totalErrors} errors, ${totalSkipped} skipped`);
    
    if (totalErrors > 0) {
      logger.warn(`${totalErrors} files could not be deleted. This may be due to file permissions or files being in use.`);
    }

  } catch (error) {
    logger.error('File cleanup failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
};

export const fixMisplacedFiles = async () => {
  try {
    logger.info('Starting file organization process...');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const profilesDir = path.join(uploadsDir, 'profiles');
    const resumesDir = path.join(uploadsDir, 'resumes');

    // Ensure directories exist
    [profilesDir, resumesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });

    let totalMoved = 0;
    let totalErrors = 0;

    // Check if there are any files in the main uploads directory that should be moved
    if (fs.existsSync(uploadsDir)) {
      try {
        const files = fs.readdirSync(uploadsDir);
        
        for (const file of files) {
          // Skip directories and system files
          if (file.startsWith('.') || file.startsWith('desktop.ini') || file.startsWith('Thumbs.db')) {
            continue;
          }

          const filePath = path.join(uploadsDir, file);
          
          try {
            const stat = fs.statSync(filePath);
            
            if (stat.isFile()) {
              const ext = path.extname(file).toLowerCase();
              let targetDir = null;
              
              // Move image files to profiles directory
              if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                targetDir = profilesDir;
              }
              // Move document files to resumes directory
              else if (['.pdf', '.doc', '.docx'].includes(ext)) {
                targetDir = resumesDir;
              }

              if (targetDir) {
                const newPath = path.join(targetDir, file);
                
                // Check if destination file already exists
                if (fs.existsSync(newPath)) {
                  logger.warn(`File already exists at destination, skipping: ${file}`);
                  continue;
                }

                try {
                  fs.renameSync(filePath, newPath);
                  logger.info(`Moved file to ${path.basename(targetDir)}: ${file}`);
                  totalMoved++;
                } catch (moveError) {
                  if (moveError.code === 'EPERM') {
                    logger.warn(`Permission denied moving file: ${file}`);
                  } else {
                    logger.error(`Error moving file ${file}: ${moveError.message}`);
                  }
                  totalErrors++;
                }
              }
            }
          } catch (statError) {
            logger.warn(`Could not read file stats for: ${file} - ${statError.message}`);
          }
        }
      } catch (error) {
        logger.error(`Error reading uploads directory: ${error.message}`);
      }
    }

    logger.success(`File organization completed: ${totalMoved} files moved, ${totalErrors} errors`);
    
  } catch (error) {
    logger.error('File organization failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
};

// Optional: Clean up function for files older than specified days
export const cleanupOldFiles = async (daysOld = 30) => {
  try {
    logger.info(`Starting cleanup of files older than ${daysOld} days...`);
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    let totalDeleted = 0;
    let totalErrors = 0;

    const checkDirectory = async (dir) => {
      if (!fs.existsSync(dir)) return;
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          
          try {
            const stats = fs.statSync(filePath);
            
            if (stats.isFile() && stats.mtime < cutoffDate) {
              const result = await safeDeleteFile(filePath);
              
              if (result.success) {
                logger.info(`Deleted old file: ${file} (${result.reason})`);
                totalDeleted++;
              } else {
                logger.warn(`Could not delete old file ${file}: ${result.reason}`);
                totalErrors++;
              }
            }
          } catch (error) {
            logger.warn(`Could not check file ${file}: ${error.message}`);
          }
        }
      } catch (error) {
        logger.error(`Error reading directory ${dir}: ${error.message}`);
      }
    };

    // Check both upload directories
    await checkDirectory(path.join(uploadsDir, 'profiles'));
    await checkDirectory(path.join(uploadsDir, 'resumes'));

    logger.success(`Old file cleanup completed: ${totalDeleted} deleted, ${totalErrors} errors`);
    
  } catch (error) {
    logger.error('Old file cleanup failed:', error);
  }
};