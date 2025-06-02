import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../../utils/logger.js";

dotenv.config();

const connectToAtlasDb = async () => {
  try {
    const uri = process.env.ATLAS_CONNECTION_STRING;
    if (!uri) {
      throw new Error("ATLAS_CONNECTION_STRING environment variable is not defined");
    }

    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Replaces maxPoolSize
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
     
    };

    logger.connection("Attempting to connect to MongoDB Atlas...");
    await mongoose.connect(uri, options);
    logger.success("Connected to MongoDB Atlas successfully");
  } catch (error) {
    if (error.code === 8000) {
      logger.error("Authentication failed. Check your username/password in the connection string.");
    } else if (error.message.includes("IP") || error.message.includes("whitelist")) {
      logger.error("IP whitelist issue. Add your IP to MongoDB Atlas Network Access.");
      logger.info("Steps to fix:");
      logger.info("1. Go to MongoDB Atlas dashboard");
      logger.info("2. Navigate to Network Access");
      logger.info("3. Click 'Add IP Address'");
      logger.info("4. Select 'Allow access from anywhere' or add your current IP");
    }
    
    throw error;
  }
};

export { connectToAtlasDb };