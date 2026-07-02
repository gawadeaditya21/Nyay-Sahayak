import express from "express";
import { generateComplaintLetterController, getFirHistory } from "../controllers/firController.js";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import { usageLimiter } from "../middleware/usageLimiter.js";

const router = express.Router();

router.post("/generate-complaint", optionalProtect, usageLimiter("fir"), generateComplaintLetterController);
router.post("/generate-fir", optionalProtect, usageLimiter("fir"), generateComplaintLetterController);
router.get("/fir/history", protect, getFirHistory);

export default router;
