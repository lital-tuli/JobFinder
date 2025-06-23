import express from "express";
import mongoose from "mongoose";
import {
  createJob,
  getAllJobs,
  getJobById,
  getJobsByRecruiterId,
  updateJob,
  applyForJob,
  saveJob,
  deleteJob
} from "../models/jobAccessDataService.js";
import auth from "../../auth/authService.js";
import validateRecruiter, { requireRecruiter } from "../../auth/recruiterAuth.js";
import { handleError } from "../../utils/handleErrors.js";
import validateJob from "../validation/jobValidationService.js";
// ✅ FIXED: Correct import paths
import Job from "../../DB/models/Job.js";
import User from "../../DB/models/User.js";
import logger from "../../utils/logger.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return handleError(res, 400, "Invalid job ID format");
  }
  next();
};

// Create a new job posting (recruiters only)
router.post("/", auth, validateRecruiter, async (req, res) => {
  try {
    const validationError = validateJob(req.body);
    if (validationError) {
      return handleError(res, 400, validationError);
    }
    
    const jobData = {
      ...req.body,
      postedBy: req.user._id
    };
    
    const job = await createJob(jobData);
    if (!job) {
      return handleError(res, 500, "Failed to create job");
    }
    
    logger.info('Job created successfully', {
      jobId: job._id,
      title: job.title,
      postedBy: req.user._id
    });
    
    return res.status(201).json(job);
  } catch (error) {
    logger.error('Job creation error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get all job postings
router.get("/", async (req, res) => {
  try {
    // Handle query parameters for filtering
    const filters = {};
    if (req.query.jobType) filters.jobType = req.query.jobType;
    if (req.query.location) filters.location = { $regex: new RegExp(req.query.location, "i") };
    if (req.query.company) filters.company = { $regex: new RegExp(req.query.company, "i") };
    if (req.query.search) {
      // Add search functionality across multiple fields
      const searchRegex = new RegExp(req.query.search, "i");
      filters.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { description: searchRegex },
        { requirements: searchRegex }
      ];
    }
    
    const jobs = await getAllJobs(filters);
    if (!jobs) {
      return handleError(res, 500, "Failed to retrieve jobs");
    }
    
    return res.status(200).json(jobs);
  } catch (error) {
    logger.error('Get jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get jobs by recruiter (alias route for compatibility)
router.get("/my-listings", auth, requireRecruiter, async (req, res) => {
  try {
    const jobs = await getJobsByRecruiterId(req.user._id);
    if (!jobs) {
      return handleError(res, 500, "Failed to retrieve jobs");
    }
    
    return res.status(200).json(jobs);
  } catch (error) {
    logger.error('Get recruiter jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get jobs by recruiter (original route)
router.get("/recruiter/my-jobs", auth, validateRecruiter, async (req, res) => {
  try {
    const jobs = await getJobsByRecruiterId(req.user._id);
    if (!jobs) {
      return handleError(res, 500, "Failed to retrieve jobs");
    }
    
    return res.status(200).json(jobs);
  } catch (error) {
    logger.error('Get recruiter jobs error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Apply for a job - SPECIFIC ROUTE FIRST
router.post("/:id/apply", auth, validateObjectId, async (req, res) => {
  try {
    // Only jobseekers can apply for jobs
    if (req.user.role === 'recruiter' && !req.user.isAdmin) {
      return handleError(res, 403, "Recruiters cannot apply for jobs");
    }
    
    const job = await applyForJob(req.params.id, req.user._id);
    if (!job) {
      return handleError(res, 500, "Failed to apply for job");
    }
    
    logger.info('Job application submitted', {
      jobId: req.params.id,
      applicantId: req.user._id,
      applicantEmail: req.user.email
    });
    
    return res.status(200).json({
      message: "Successfully applied for job",
      job: job
    });
  } catch (error) {
    logger.error('Job application error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Save a job
router.post("/:id/save", auth, validateObjectId, async (req, res) => {
  try {
    const result = await saveJob(req.params.id, req.user._id);
    if (!result) {
      return handleError(res, 500, "Failed to save job");
    }
    
    logger.info('Job saved', {
      jobId: req.params.id,
      userId: req.user._id
    });
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Save job error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get job applicants (for recruiters and admins only) - NEW ROUTE
router.get("/:id/applicants", auth, requireRecruiter, validateObjectId, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;
    const isAdmin = req.user.isAdmin;

    // Get the job with populated applicants
    const job = await Job.findById(jobId)
      .populate({
        path: 'applicants',
        select: 'name email profession bio resume profilePicture createdAt role',
        options: { sort: { createdAt: -1 } }
      })
      .populate('postedBy', 'name email');

    if (!job) {
      return handleError(res, 404, "Job not found");
    }

    // Authorization check: Only job owner or admin can view applicants
    if (job.postedBy._id.toString() !== userId && !isAdmin) {
      logger.warn('Unauthorized attempt to view job applicants', {
        userId,
        jobId,
        jobOwner: job.postedBy._id
      });
      return handleError(res, 403, "Not authorized to view applicants for this job");
    }

    // Format applicant data
    const formattedApplicants = job.applicants.map(applicant => ({
      _id: applicant._id,
      name: {
        first: applicant.name.first,
        last: applicant.name.last
      },
      email: applicant.email,
      profession: applicant.profession,
      bio: applicant.bio,
      profilePicture: applicant.profilePicture,
      hasResume: !!applicant.resume,
      appliedAt: applicant.createdAt,
      role: applicant.role
    }));

    const response = {
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        totalApplicants: job.applicants.length,
        postedBy: job.postedBy.name
      },
      applicants: formattedApplicants,
      pagination: {
        total: formattedApplicants.length,
        page: 1,
        limit: formattedApplicants.length
      }
    };

    logger.info('Job applicants retrieved successfully', {
      recruiterId: userId,
      jobId,
      applicantCount: formattedApplicants.length
    });

    res.status(200).json(response);

  } catch (error) {
    logger.error('Get job applicants error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get applicant's resume (for job poster only) - NEW ROUTE
router.get("/:jobId/applicants/:applicantId/resume", auth, requireRecruiter, async (req, res) => {
  try {
    const { jobId, applicantId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.isAdmin;

    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(applicantId)) {
      return handleError(res, 400, "Invalid ID format");
    }

    // Verify job ownership first
    const job = await Job.findById(jobId);
    if (!job) {
      return handleError(res, 404, "Job not found");
    }

    if (job.postedBy.toString() !== userId && !isAdmin) {
      return handleError(res, 403, "Not authorized to access this applicant's resume");
    }

    // Verify the user actually applied to this job
    if (!job.applicants.includes(applicantId)) {
      return handleError(res, 404, "Applicant not found for this job");
    }

    // Get the applicant's resume
    const applicant = await User.findById(applicantId).select('resume name');
    if (!applicant || !applicant.resume) {
      return handleError(res, 404, "Resume not found");
    }

    const resumePath = path.resolve(applicant.resume);
    if (!fs.existsSync(resumePath)) {
      return handleError(res, 404, "Resume file not found on server");
    }

    // Set appropriate headers
    const fileName = `${applicant.name.first}_${applicant.name.last}_resume.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Log the download
    logger.info('Resume downloaded by recruiter', {
      recruiterId: userId,
      applicantId,
      jobId,
      fileName
    });

    res.sendFile(resumePath);

  } catch (error) {
    logger.error('Resume download error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Get a specific job by ID
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return handleError(res, 404, "Job not found");
    }
    
    return res.status(200).json(job);
  } catch (error) {
    logger.error('Get job by ID error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Update a job listing
router.put("/:id", auth, validateObjectId, async (req, res) => {
  try {
    const validationError = validateJob(req.body);
    if (validationError) {
      return handleError(res, 400, validationError);
    }
    
    const job = await updateJob(req.params.id, req.body, req.user._id);
    if (!job) {
      return handleError(res, 500, "Failed to update job");
    }
    
    logger.info('Job updated successfully', {
      jobId: req.params.id,
      updatedBy: req.user._id
    });
    
    return res.status(200).json(job);
  } catch (error) {
    logger.error('Job update error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

// Delete a job
router.delete("/:id", auth, validateObjectId, async (req, res) => {
  try {
    const result = await deleteJob(req.params.id, req.user._id);
    if (!result) {
      return handleError(res, 500, "Failed to delete job");
    }
    
    logger.info('Job deleted successfully', {
      jobId: req.params.id,
      deletedBy: req.user._id
    });
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Job deletion error:', error);
    return handleError(res, error.status || 500, error.message);
  }
});

export default router;
