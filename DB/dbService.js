import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectToAtlasDb } from "./mongodb/connectToAtlas.js";
import { connectToLocalDb } from "./mongodb/connectToMongoLocally.js";
import logger from "../utils/logger.js";

// Load environment variables
dotenv.config();

// Get environment from config or environment variable
const ENVIRONMENT = process.env.NODE_ENV || "development";

const connectToDB = async () => {
  try {
    // Set mongoose options to prevent memory leaks
    mongoose.set('strictQuery', false);
    mongoose.set('bufferCommands', false);
    
    // Try Atlas first if connection string is provided
    if (process.env.ATLAS_CONNECTION_STRING) {
      logger.connection("Attempting Atlas connection...");
      await connectToAtlasDb();
    } else {
      logger.connection("Using local MongoDB connection...");
      await connectToLocalDb();
    }
    logger.success(`MongoDB connected successfully in ${ENVIRONMENT} mode`);
  } catch (error) {
    logger.error("Primary database connection failed:", error);
    
    // If Atlas fails, try local as fallback
    if (process.env.ATLAS_CONNECTION_STRING) {
      logger.warn("Attempting fallback to local MongoDB...");
      try {
        await connectToLocalDb();
        logger.success("Connected to local MongoDB as fallback");
      } catch (localError) {
        logger.error("Local MongoDB connection also failed:", localError);
        logger.error("Please ensure either MongoDB Atlas is properly configured or MongoDB is running locally");
        process.exit(1);
      }
    } else {
      logger.error("No MongoDB connection available");
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.success('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected');
});

// Prevent memory leaks from connection pooling
mongoose.connection.on('close', () => {
  logger.info('Mongoose connection closed');
});

// Handle app termination gracefully
const gracefulShutdown = async (signal) => {
  logger.warn(`${signal} received. Gracefully shutting down...`);
  try {
    await mongoose.connection.close();
    logger.success('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default connectToDB;