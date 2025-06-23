const express = require('express');
const router = express.Router();

router.post('/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    const fileRecord = new File({
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      userId: req.user._id,
      fieldname: 'resume',
      path: req.file.path
    });
    
    await fileRecord.save();
    
    // Update user's resume reference
    await User.findByIdAndUpdate(req.user._id, { resume: fileRecord._id });
    
    res.json({
      message: 'Resume uploaded successfully',
      file: fileRecord,
      url: `/api/files/${fileRecord._id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Secure file serving endpoint
router.get('/:fileId', authenticateToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Authorization check
    if (file.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
    
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});