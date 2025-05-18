import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToAtlasDb = async () => {
  try {
    const uri = process.env.ATLAS_CONNECTION_STRING;
    if (!uri) {
      throw new Error("ATLAS_CONNECTION_STRING environment variable is not defined");
    }

    // Updated connection options (removed deprecated ones)
    const options = {
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    console.log("Attempting to connect to MongoDB Atlas...");
    await mongoose.connect(uri, options);
    console.log("✅ Connected to MongoDB Atlas successfully");
  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:");
    console.error("Error message:", error.message);
    
    if (error.code === 8000) {
      console.error("Authentication failed. Check your username/password in the connection string.");
    } else if (error.message.includes("IP") || error.message.includes("whitelist")) {
      console.error("IP whitelist issue. Add your IP to MongoDB Atlas Network Access.");
      console.error("Steps to fix:");
      console.error("1. Go to MongoDB Atlas dashboard");
      console.error("2. Navigate to Network Access");
      console.error("3. Click 'Add IP Address'");
      console.error("4. Select 'Allow access from anywhere' or add your current IP");
    }
    
    throw error;
  }
};

export { connectToAtlasDb };