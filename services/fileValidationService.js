import path from 'path';

export const validateFile = (file, type) => {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  // Check file size
  const maxSizes = {
    profilePicture: 5 * 1024 * 1024, // 5MB
    resume: 10 * 1024 * 1024 // 10MB
  };

  if (file.size > maxSizes[type]) {
    errors.push(`File too large. Maximum size: ${maxSizes[type] / (1024 * 1024)}MB`);
  }

  // Check file type
  const allowedTypes = {
    profilePicture: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    resume: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  };

  if (!allowedTypes[type].includes(file.mimetype)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes[type].join(', ')}`);
  }

  // Check filename for security
  const filename = file.originalname;
  if (!/^[a-zA-Z0-9\s\-_.()]+\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i.test(filename)) {
    errors.push('Invalid filename. Use only letters, numbers, spaces, and common punctuation.');
  }

  return errors;
};