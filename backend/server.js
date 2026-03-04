// Load environment variables from .env file
import "dotenv/config";

import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysisRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

// Validate environment variables on startup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is not set in .env file");
  console.error("Please add GEMINI_API_KEY=your_key_here to backend/.env");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Primary Document Analysis Route (Recommended)
app.use("/api/document", documentRoutes);

// Legacy routes (for backward compatibility)
app.use("/api", analysisRoutes);
app.use("/api", ocrRoutes);
app.use("/api/pdf", pdfRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Server running on port", PORT);
  console.log("✅ Environment:", process.env.NODE_ENV || "development");
  console.log("✅ Gemini API Key:", process.env.GEMINI_API_KEY ? "Loaded (first 10 chars: " + process.env.GEMINI_API_KEY.substring(0, 10) + "...)" : "❌ NOT SET");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
