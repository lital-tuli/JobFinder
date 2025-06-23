import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
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
  
  // ✅ UPDATED: Better job type options
  jobType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Freelance", "Internship"],
    required: true,
  },
  
  // ✅ NEW: Work location type (for remote work filtering)
  workLocation: {
    type: String,
    enum: ["Remote", "On-site", "Hybrid"],
    default: "On-site"
  },
  
  // ✅ NEW: Experience level (for better filtering)
  experienceLevel: {
    type: String,
    enum: ["Entry", "Mid", "Senior"],
    default: "Mid"
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
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  
  // ✅ ENHANCED: Application count for easier tracking
  applicationCount: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // ✅ NEW: Job status for better management
  status: {
    type: String,
    enum: ["active", "paused", "closed"],
    default: "active"
  }
}, { 
  timestamps: true 
});

// ✅ INDEXES: For better search performance
jobSchema.index({ postedBy: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ workLocation: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ status: 1, isActive: 1 });

// ✅ TEXT SEARCH: For job search functionality
jobSchema.index({
  title: 'text',
  company: 'text',
  description: 'text',
  location: 'text'
});

// ✅ SIMPLE METHODS: Essential functionality only
jobSchema.methods.addApplicant = function(userId) {
  if (!this.applicants.includes(userId)) {
    this.applicants.push(userId);
    this.applicationCount = this.applicants.length;
    return this.save();
  }
  return this;
};

jobSchema.methods.hasApplied = function(userId) {
  return this.applicants.includes(userId);
};

// ✅ MIDDLEWARE: Auto-update application count
jobSchema.pre('save', function(next) {
  if (this.isModified('applicants')) {
    this.applicationCount = this.applicants.length;
  }
  next();
});

export default mongoose.model("Job", jobSchema);