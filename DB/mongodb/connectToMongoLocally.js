import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../../utils/logger.js";

dotenv.config();

const connectToLocalDb = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/JobFinder";
    
    // Simple options for local connection
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };
    
    await mongoose.connect(uri, options);
    logger.success(`Connected to MongoDB locally at ${uri}`);
  } catch (error) {
    logger.error("Could not connect to MongoDB locally:", error);
    logger.info("Solutions:");
    logger.info("1. Make sure MongoDB is installed and running locally");
    logger.info("2. Run: mongod --dbpath /path/to/your/db");
    logger.info("3. Or install MongoDB Community Edition from https://www.mongodb.com/try/download/community");
    throw error;
  }
};

export { connectToLocalDb };