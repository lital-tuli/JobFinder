// Submit job application
router.post('/', authenticateToken, authorize(['jobseeker']), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    
    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(400).json({ error: 'Job not available' });
    }
    
    // Check for existing application
    const existingApplication = await Application.findOne({
      jobId,
      applicantId: req.user._id
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }
    
    const application = new Application({
      jobId,
      applicantId: req.user._id,
      coverLetter,
      resumeUrl: req.user.resume ? `/api/files/${req.user.resume}` : null
    });
    
    await application.save();
    
    // Increment application count on job
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });
    
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications for a job (Recruiter only)
router.get('/job/:jobId', authenticateToken, authorize(['recruiter', 'admin']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    // Authorization: only job creator or admin can view applications
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('applicantId', 'name email phone')
      .sort({ appliedAt: -1 });
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.patch('/:applicationId/status', authenticateToken, authorize(['recruiter', 'admin']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const application = await Application.findById(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Authorization check
    const job = await Job.findById(application.jobId);
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update status and add to history
    const oldStatus = application.status;
    application.status = status;
    application.statusHistory.push({
      status,
      changedBy: req.user._id,
      notes
    });
    
    await application.save();
    
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});