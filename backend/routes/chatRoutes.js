import express from "express";
import { chatWithLegalAssistant, getChatSessions, getChatHistoryBySession } from "../controllers/chatController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { upload, handleUploadError } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/sessions", protect, getChatSessions);
router.get("/:sessionId", protect, getChatHistoryBySession);
router.post("/", optionalProtect, upload.single("document"), chatWithLegalAssistant);

router.use(handleUploadError);

export default router;
