import express from "express";
import { analyseText, analyzeWithGemini } from "../controllers/analysisController.js";

const router = express.Router();

// Original ML analysis endpoint
router.post("/analyse", analyseText);

// New Gemini AI analysis endpoint
// This uses Google Gemini API for legal document analysis
router.post("/analyze-with-gemini", analyzeWithGemini);

export default router;