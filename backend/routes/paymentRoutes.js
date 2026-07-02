import express from "express";
import { createCheckoutSession, verifyCheckoutSession } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Webhook is mounted directly in server.js to ensure raw body parsing
// Protected routes
router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/verify-session/:sessionId", protect, verifyCheckoutSession);

export default router;
