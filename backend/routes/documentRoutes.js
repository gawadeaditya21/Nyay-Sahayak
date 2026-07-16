import express from "express";
import {
  uploadAndAnalyzeDocument,
  analyzeTextOnly,
  getAnalysisSessions,
  getAnalysisHistoryBySession,
} from "../controllers/documentController.js";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import { upload, handleUploadError } from "../middleware/uploadMiddleware.js";
import { usageLimiter } from "../middleware/usageLimiter.js";

import { detectUserTier } from "../src/middleware/tierDetection.js";
import { createRateLimiter } from "../src/middleware/rateLimiter.js";

const router = express.Router();

router.post("/analyze", 
  optionalProtect, 
  detectUserTier,
  createRateLimiter('analysis', 'perHour'),
  createRateLimiter('analysis', 'perDay'),
  usageLimiter("analysis"), 
  upload.single("document"), 
  uploadAndAnalyzeDocument
);

router.post("/analyze-text", 
  optionalProtect, 
  detectUserTier,
  createRateLimiter('analysis', 'perHour'),
  createRateLimiter('analysis', 'perDay'),
  usageLimiter("analysis"), 
  analyzeTextOnly
);
router.get("/sessions", protect, getAnalysisSessions);

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Document analysis service is running",
    timestamp: new Date().toISOString(),
  });
});

router.get("/:sessionId", protect, getAnalysisHistoryBySession);

router.use(handleUploadError);

export default router;
