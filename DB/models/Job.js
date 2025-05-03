import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 256,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 256,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 1024,
      trim: true,
    },
    requirements: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 1024,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 256,
      trim: true,
    },
    salary: {
      type: String,
      trim: true,
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ postedBy: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ location: 1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;