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
import validateRecruiter from "../../auth/recruiterAuth.js";
import { handleError } from "../../utils/handleErrors.js";
import validateJob from "../validation/jobValidationService.js";

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
    if (job.error) {
      return handleError(res, job.status || 500, job.message);
    }
    
    return res.status(201).json(job);
  } catch (error) {
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
    
    const jobs = await getAllJobs(filters);
    if (jobs.error) {
      return handleError(res, jobs.status || 500, jobs.message);
    }
    
    return res.status(200).json(jobs);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Get jobs posted by the logged-in recruiter
router.get("/my-listings", auth, validateRecruiter, async (req, res) => {
  try {
    const jobs = await getJobsByRecruiterId(req.user._id);
    if (jobs.error) {
      return handleError(res, jobs.status || 500, jobs.message);
    }
    
    return res.status(200).json(jobs);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Get a job by ID (with validation)
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (job.error) {
      return handleError(res, job.status || 404, job.message);
    }
    
    return res.status(200).json(job);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Update a job listing (with validation)
router.put("/:id", auth, validateObjectId, async (req, res) => {
  try {
    const validationError = validateJob(req.body);
    if (validationError) {
      return handleError(res, 400, validationError);
    }
    
    const job = await updateJob(req.params.id, req.body, req.user._id);
    if (job.error) {
      return handleError(res, job.status || 500, job.message);
    }
    
    return res.status(200).json(job);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Apply for a job (with validation)
router.post("/:id/apply", auth, validateObjectId, async (req, res) => {
  try {
    // Only jobseekers can apply for jobs
    if (req.user.role !== "jobseeker") {
      return handleError(res, 403, "Only jobseekers can apply for jobs");
    }
    
    const job = await applyForJob(req.params.id, req.user._id);
    if (job.error) {
      return handleError(res, job.status || 500, job.message);
    }
    
    return res.status(200).json(job);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Save a job for later (with validation)
router.post("/:id/save", auth, validateObjectId, async (req, res) => {
  try {
    const result = await saveJob(req.params.id, req.user._id);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

// Delete a job (with validation)
router.delete("/:id", auth, validateObjectId, async (req, res) => {
  try {
    const result = await deleteJob(req.params.id, req.user._id);
    if (result.error) {
      return handleError(res, result.status || 500, result.message);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error.status || 500, error.message);
  }
});

export default router;