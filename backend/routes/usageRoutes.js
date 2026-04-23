import express from "express";
import { getUsageStatus } from "../controllers/usageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/usage/status — Returns current usage + limits for the logged-in user
router.get("/status", protect, getUsageStatus);

export default router;
