// server.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./DB/connect.js";
import corsMiddleware from "./middlewares/cors.js";
import { loggerMiddleware } from "./logger/loggerService.js";
import router from "./router/router.js";
import { handleError } from "./utils/handleErrors.js";
import seedData from "./utils/seedDB.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loggerMiddleware());

// API routes
app.use("/api/v1", router);

// Error handling middleware
app.use((err, req, res, next) => {
  const message = err.message || "Internal Server Error";
  return handleError(res, err.status || 500, message);
});

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("MongoDB connected successfully");

    // Seed initial data if needed
    await seedData();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server error:", error.message);
    process.exit(1);
  }
};

startServer();