import express from "express";
import { analyseText } from "../controllers/analysisController.js";

const router = express.Router();

router.post("/analyse", analyseText);

export default router;