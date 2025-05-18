import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToLocalDb = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/JobFinder";
    
    // Simple options for local connection
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };
    
    await mongoose.connect(uri, options);
    console.log("✅ Connected to MongoDB locally at", uri);
  } catch (error) {
    console.error("❌ Could not connect to MongoDB locally:");
    console.error("Error:", error.message);
    console.error("\n💡 Solutions:");
    console.error("1. Make sure MongoDB is installed and running locally");
    console.error("2. Run: mongod --dbpath /path/to/your/db");
    console.error("3. Or install MongoDB Community Edition from https://www.mongodb.com/try/download/community");
    throw error;
  }
};

export { connectToLocalDb };