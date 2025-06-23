import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  role: {
    type: String,
    enum: {
      values: ['jobSeeker', 'recruiter', 'admin'],
      message: 'Role must be either jobSeeker, recruiter, or admin'
    },
    default: 'jobSeeker'
  },
  
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Each skill cannot exceed 50 characters']
  }],
  
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please provide a valid phone number'
    ]
  },
  
  profilePicture: {
    type: String,
    default: ''
  },
  
  resume: {
    filename: {
      type: String,
      default: ''
    },
    originalName: {
      type: String,
      default: ''
    },
    path: {
      type: String,
      default: ''
    },
    uploadDate: {
      type: Date
    }
  },
  
  // Job-related fields
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  
  appliedJobs: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'interviewed', 'rejected', 'hired'],
      default: 'pending'
    },
    coverLetter: {
      type: String,
      maxlength: [1000, 'Cover letter cannot exceed 1000 characters']
    }
  }],
  
  // Company information for recruiters
  company: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Company description cannot exceed 500 characters']
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+/,
        'Please provide a valid website URL'
      ]
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [50, 'Industry cannot exceed 50 characters']
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    }
  },
  
  // Account status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  
  lockUntil: {
    type: Date,
    select: false
  },
  
  // Notification preferences
  notifications: {
    email: {
      jobAlerts: {
        type: Boolean,
        default: true
      },
      applicationUpdates: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: false
      }
    },
    push: {
      jobAlerts: {
        type: Boolean,
        default: false
      },
      messages: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Social links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?linkedin\.com\/.+/,
        'Please provide a valid LinkedIn URL'
      ]
    },
    github: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?github\.com\/.+/,
        'Please provide a valid GitHub URL'
      ]
    },
    portfolio: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+/,
        'Please provide a valid portfolio URL'
      ]
    }
  },
  
  // Analytics and tracking
  profileViews: {
    type: Number,
    default: 0
  },
  
  searchHistory: [{
    query: String,
    filters: mongoose.Schema.Types.Mixed,
    searchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(_doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// =============================================================================
// INDEXES
// =============================================================================

// Improve query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'company.name': 1 });
userSchema.index({ location: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ createdAt: -1 });

// Compound indexes for common queries
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });

// =============================================================================
// VIRTUAL FIELDS
// =============================================================================

// Full name virtual
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Account locked virtual
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Application count virtual
userSchema.virtual('applicationCount').get(function() {
  return this.appliedJobs ? this.appliedJobs.length : 0;
});

// Saved jobs count virtual
userSchema.virtual('savedJobsCount').get(function() {
  return this.savedJobs ? this.savedJobs.length : 0;
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Update the updatedAt field before updating
userSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Remove related data when user is deleted
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove user from job applications
    const Job = mongoose.model('Job');
    await Job.updateMany(
      { 'applications.userId': this._id },
      { $pull: { applications: { userId: this._id } } }
    );
    
    // If user is recruiter, handle their jobs
    if (this.role === 'recruiter') {
      await Job.updateMany(
        { recruiterId: this._id },
        { $set: { recruiterId: null, isActive: false } }
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

// Check if user has applied to a specific job
userSchema.methods.hasAppliedToJob = function(jobId) {
  return this.appliedJobs.some(application => 
    application.jobId.toString() === jobId.toString()
  );
};

// Check if user has saved a specific job
userSchema.methods.hasSavedJob = function(jobId) {
  return this.savedJobs.some(savedJobId => 
    savedJobId.toString() === jobId.toString()
  );
};

// Add job to saved jobs
userSchema.methods.saveJob = function(jobId) {
  if (!this.hasSavedJob(jobId)) {
    this.savedJobs.push(jobId);
  }
  return this.save();
};

// Remove job from saved jobs
userSchema.methods.unsaveJob = function(jobId) {
  this.savedJobs = this.savedJobs.filter(savedJobId => 
    savedJobId.toString() !== jobId.toString()
  );
  return this.save();
};

// Apply to job
userSchema.methods.applyToJob = function(jobId, coverLetter = '') {
  if (!this.hasAppliedToJob(jobId)) {
    this.appliedJobs.push({
      jobId,
      coverLetter,
      appliedAt: new Date(),
      status: 'pending'
    });
  }
  return this.save();
};

// Update application status
userSchema.methods.updateApplicationStatus = function(jobId, status) {
  const application = this.appliedJobs.find(app => 
    app.jobId.toString() === jobId.toString()
  );
  
  if (application) {
    application.status = status;
    return this.save();
  }
  
  throw new Error('Application not found');
};

// =============================================================================
// STATIC METHODS
// =============================================================================

// Find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Find recruiters with company info
userSchema.statics.findRecruiters = function() {
  return this.find({ 
    role: 'recruiter', 
    isActive: true,
    'company.name': { $exists: true, $ne: '' }
  });
};

// Search users by skills
userSchema.statics.searchBySkills = function(skills) {
  return this.find({
    skills: { $in: skills },
    isActive: true
  });
};

// Get user statistics
userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { 
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
        }
      }
    }
  ]);
  
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ isActive: true });
  
  return {
    total: totalUsers,
    active: activeUsers,
    byRole: stats
  };
};

export default mongoose.model("User", userSchema);