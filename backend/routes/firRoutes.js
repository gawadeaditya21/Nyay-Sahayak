import express from "express";
import { generateComplaintLetterController, getFirHistory } from "../controllers/firController.js";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import { usageLimiter } from "../middleware/usageLimiter.js";

import { detectUserTier } from "../src/middleware/tierDetection.js";
import { createRateLimiter } from "../src/middleware/rateLimiter.js";

const router = express.Router();

router.post("/generate-complaint", 
  optionalProtect, 
  detectUserTier,
  createRateLimiter('fir', 'perHour'),
  createRateLimiter('fir', 'perDay'),
  usageLimiter("fir"), 
  generateComplaintLetterController
);

router.post("/generate-fir", 
  optionalProtect, 
  detectUserTier,
  createRateLimiter('fir', 'perHour'),
  createRateLimiter('fir', 'perDay'),
  usageLimiter("fir"), 
  generateComplaintLetterController
);
router.get("/fir/history", protect, getFirHistory);

export default router;
