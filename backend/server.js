// Load environment variables from .env file manually (Fallback for missing dotenv)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Node's native environment variable loader (Available in Node >= 20.6.0)
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
} catch (err) {
  console.warn('⚠️ Could not load .env file manually', err.message);
}
import connectDB from "./config/db.js";
import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes.js";
import authRoutes from "./routes/authRoutes.js";    
import chatRoutes from "./routes/chatRoutes.js";
import firRoutes from "./routes/firRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import usageRoutes from "./routes/usageRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { stripeWebhook } from "./controllers/paymentController.js";
import { rateLimit } from "./middleware/rateLimit.js";

// Validate environment variables on startup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is not set in .env file");
  console.error("Please add GEMINI_API_KEY=your_key_here to backend/.env");
  process.exit(1);
}
connectDB();
const app = express();

app.use(cors());

// STRIPE WEBHOOK MUST BE BEFORE express.json()
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use("/api/payment", paymentRoutes);

// Primary Document Analysis Route (Recommended)
app.use("/api/document", rateLimit, documentRoutes);

// Legacy routes removed
app.use("/api/generate-fir", rateLimit);
app.use("/api/generate-complaint", rateLimit);
app.use("/api", firRoutes);

// auth routes
app.use('/api/auth', authRoutes);
app.use("/api/chat", rateLimit, chatRoutes);
app.use("/api/dashboard", rateLimit, dashboardRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Server running on port", PORT);
  console.log("✅ Environment:", process.env.NODE_ENV || "development");
  console.log("✅ Gemini API Key:", process.env.GEMINI_API_KEY ? "Loaded" : "❌ NOT SET");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
