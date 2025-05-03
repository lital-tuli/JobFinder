import Job from "../../DB/models/Job.js";
import User from "../../DB/models/User.js";
import { createError } from "../../utils/handleErrors.js";

// Create a new job
const createJob = async (jobData) => {
  try {
    const job = new Job(jobData);
    await job.save();
    return job;
  } catch (error) {
    return createError("Mongoose", error);
  }
};

// Get all jobs with optional filters
const getAllJobs = async (filters = {}) => {
  try {
    const query = { isActive: true };
    
    // Apply filters
    if (filters.jobType) query.jobType = filters.jobType;
    if (filters.location) query.location = { $regex: new RegExp(filters.location, "i") };
    
    return await Job.find(query)
      .populate("postedBy", "name.first name.last email")
      .sort({ createdAt: -1 });
  } catch (error) {
    return createError("Mongoose", error);
  }
};

// Get a job by ID
const getJobById = async (jobId) => {
  try {
    const job = await Job.findById(jobId).populate("postedBy", "name email");
    if (!job) {
      const error = new Error("Job not found");
      error.status = 404;
      throw error;
    }
    return job;
  } catch (error) {
    return createError("Mongoose", error);
  }
};

// Get jobs by recruiter ID
const getJobsByRecruiterId = async (recruiterId) => {
  try {
    return await Job.find({ postedBy: recruiterId }).sort({ createdAt: -1 });
  } catch (error) {
    return createError("Mongoose", error);
  }
};

// Update a job
const updateJob = async (jobId, updatedData, userId) => {
  try {
    const job = await Job.findById(jobId);
    if (!job) {
      const error = new Error("Job not found");
      error.status = 404;
      throw error;
    }
    
    if (job.postedBy.toString() !== userId) {
      const error = new Error("Not authorized to update this job");
      error.status = 403;
      throw error;
    }
    
    return await Job.findByIdAndUpdate(jobId, updatedData, { new: true });
  } catch (error) {
    return createError("Mongoose", error);
  }
};

// Apply for a job
const applyForJob = async (jobId, userId) => {
  try {
    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      const error = new Error("Job not found");
      error.status = 404;
      throw error;
    }
    
    // Check if already applied
    if (job.applicants.includes(userId)) {
      const error = new Error("Already applied to this job");
      error.status = 400;
      throw error;
    }
    
    // Update job applicants
    job.applicants.push(userId);
    await job.save();
    
    // Update user's applied jobs
    await User.findByIdAndUpdate(
      userId,
      { $push: { appliedJobs: jobId } }
    );
    
    return job;
  } catch (error) {
    return createError("Mongoose", error);
  }
};

// Save a job
const saveJob = async (jobId, userId) => {
  try {
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      const error = new Error("Job not found");
      error.status = 404;
      throw error;
    }
    
    // Update user's saved jobs
    const user = await User.findById(userId);
    if (user.savedJobs.includes(jobId)) {
      // Remove from saved jobs if already saved
      await User.findByIdAndUpdate(
        userId,
        { $pull: { savedJobs: jobId } }
      );
      return { message: "Job removed from saved jobs" };
    } else {
      // Add to saved jobs
      await User.findByIdAndUpdate(
        userId,
        { $push: { savedJobs: jobId } }
      );
      return { message: "Job saved successfully" };
    }
  } catch (error) {
    return createError("Mongoose", error);
  }
};

// Delete a job
const deleteJob = async (jobId, userId) => {
  try {
    const job = await Job.findById(jobId);
    if (!job) {
      const error = new Error("Job not found");
      error.status = 404;
      throw error;
    }
    
    if (job.postedBy.toString() !== userId) {
      const error = new Error("Not authorized to delete this job");
      error.status = 403;
      throw error;
    }
    
    await Job.findByIdAndDelete(jobId);
    return { message: "Job deleted successfully" };
  } catch (error) {
    return createError("Mongoose", error);
  }
};

export {
  createJob,
  getAllJobs,
  getJobById,
  getJobsByRecruiterId,
  updateJob,
  applyForJob,
  saveJob,
  deleteJob
};