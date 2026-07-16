import express from "express";
import { chatWithLegalAssistant, getChatSessions, getChatHistoryBySession } from "../controllers/chatController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { upload, handleUploadError } from "../middleware/uploadMiddleware.js";
import { usageLimiter } from "../middleware/usageLimiter.js";

import { detectUserTier } from "../src/middleware/tierDetection.js";
import { createRateLimiter } from "../src/middleware/rateLimiter.js";

const router = express.Router();

router.get("/sessions", protect, getChatSessions);
router.get("/:sessionId", protect, getChatHistoryBySession);
router.post("/", 
  optionalProtect, 
  detectUserTier, 
  createRateLimiter('chat', 'perHour'), 
  createRateLimiter('chat', 'perDay'), 
  usageLimiter("chat"), 
  upload.single("document"), 
  chatWithLegalAssistant
);

router.use(handleUploadError);

export default router;
