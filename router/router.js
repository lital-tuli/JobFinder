// router/router.js
import express from "express";
import userRoutes from "../users/routes/userRoutes.js";
import jobRoutes from "../jobs/routes/jobRoutes.js";
import { handleError } from "../utils/handleErrors.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/jobs", jobRoutes);

// Handle 404 routes
router.use((req, res) => {
  handleError(res, 404, "Route not found");
});

export default router;