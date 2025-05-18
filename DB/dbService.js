import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectToAtlasDb } from "./mongodb/connectToAtlas.js";
import { connectToLocalDb } from "./mongodb/connectToMongoLocally.js";

// Load environment variables
dotenv.config();

// Get environment from config or environment variable
const ENVIRONMENT = process.env.NODE_ENV || "development";

const connectToDB = async () => {
  try {
    // Try Atlas first if connection string is provided
    if (process.env.ATLAS_CONNECTION_STRING) {
      console.log("🌐 Attempting Atlas connection...");
      await connectToAtlasDb();
    } else {
      console.log("🏠 Using local MongoDB connection...");
      await connectToLocalDb();
    }
    console.log(`✅ MongoDB connected successfully in ${ENVIRONMENT} mode`);
  } catch (error) {
    console.error("❌ Primary database connection failed:", error.message);
    
    // If Atlas fails, try local as fallback
    if (process.env.ATLAS_CONNECTION_STRING) {
      console.log("🔄 Attempting fallback to local MongoDB...");
      try {
        await connectToLocalDb();
        console.log("✅ Connected to local MongoDB as fallback");
      } catch (localError) {
        console.error("❌ Local MongoDB connection also failed:", localError.message);
        console.error("💡 Please ensure either MongoDB Atlas is properly configured or MongoDB is running locally");
        process.exit(1);
      }
    } else {
      console.error("💡 No MongoDB connection available");
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected');
});

// Handle app termination gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

export default connectToDB;