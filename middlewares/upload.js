const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDirs = () => {
  const dirs = ['uploads/resumes', 'uploads/avatars'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.fieldname === 'resume' ? 'uploads/resumes/' : 'uploads/avatars/';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    resume: {
      mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      extensions: ['.pdf', '.doc', '.docx']
    },
    avatar: {
      mimes: ['image/jpeg', 'image/png', 'image/gif'],
      extensions: ['.jpg', '.jpeg', '.png', '.gif']
    }
  };

  const fileType = allowedTypes[file.fieldname];
  if (!fileType) {
    return cb(new Error('Invalid field name'));
  }

  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (!fileType.mimes.includes(file.mimetype) || !fileType.extensions.includes(fileExt)) {
    return cb(new Error(`Invalid file type for ${file.fieldname}`));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});