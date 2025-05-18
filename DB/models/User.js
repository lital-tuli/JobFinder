import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      first: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 256,
        trim: true,
      },
      middle: {
        type: String,
        minLength: 0,
        maxLength: 256,
        default: "",
        trim: true,
      },
      last: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 256,
        trim: true,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    appliedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    role: {
      type: String,
      enum: ["jobseeker", "recruiter", "admin"],  // Added admin role
      default: "jobseeker",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resume: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
      default: "No bio provided",
    },
    profession: {
      type: String,
      default: "Not specified",
    },
  },
  { timestamps: true }
);

// Middleware to sync role and isAdmin
userSchema.pre('save', function(next) {
  if (this.role === 'admin') {
    this.isAdmin = true;
  } else if (this.isModified('role') && this.role !== 'admin') {
    this.isAdmin = false;
  }
  next();
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model("User", userSchema);

export default User;