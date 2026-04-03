import express from "express";
import { generateFir } from "../controllers/firController.js";

const router = express.Router();

router.post("/generate-fir", generateFir);

export default router;
