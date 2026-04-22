import express from "express";
import { createCheckoutSession, stripeWebhook } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // Assuming this exists to populate req.user

const router = express.Router();

// Webhook is mounted directly in server.js to ensure raw body parsing
// Protected routes
router.post("/create-checkout-session", authMiddleware, createCheckoutSession);

export default router;
