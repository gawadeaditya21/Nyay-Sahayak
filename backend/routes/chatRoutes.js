import express from "express";
import { chatWithLegalAssistant } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", chatWithLegalAssistant);

export default router;
