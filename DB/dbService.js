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
    // Use Atlas for production, local for development
    if (ENVIRONMENT === "production" || process.env.ATLAS_CONNECTION_STRING) {
      await connectToAtlasDb();
    } else {
      await connectToLocalDb();
    }
    console.log(`MongoDB connected in ${ENVIRONMENT} mode`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Handle app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

export default connectToDB;