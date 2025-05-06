// DB/dbService.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectToAtlasDb } from "./mongodb/connectToAtlas.js";
import { connectToLocalDb } from "./mongodb/connectToMongoLocally.js";
import config from "config";

// Load environment variables
dotenv.config();

// Get environment from config or environment variable
const ENVIRONMENT = process.env.NODE_ENV || "development";

const connectToDB = async () => {
  try {
    if (ENVIRONMENT === "production") {
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

export default connectToDB;