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
      enum: ["jobseeker", "recruiter"],
      default: "jobseeker",
    },
    isAdmin: {
      type: Boolean,
      default: false,
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
      default: "Unemployed",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;