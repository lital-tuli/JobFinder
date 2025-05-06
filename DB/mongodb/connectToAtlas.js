// DB/mongodb/connectToAtlas.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToAtlasDb = async () => {
  try {
    const uri = process.env.ATLAS_CONNECTION_STRING;
    if (!uri) {
      throw new Error("ATLAS_CONNECTION_STRING environment variable is not defined");
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("Could not connect to MongoDB Atlas:", error);
    throw error;
  }
};

export { connectToAtlasDb };