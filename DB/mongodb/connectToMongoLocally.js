// DB/mongodb/connectToMongoLocally.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToLocalDb = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/JobFinder";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB locally");
  } catch (error) {
    console.error("Could not connect to MongoDB locally:", error);
    throw error;
  }
};

export { connectToLocalDb };