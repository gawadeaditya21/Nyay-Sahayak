// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENT ROUTES - Main API endpoints for document analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import express from "express";
import multer from "multer";
import path from "path";
import { 
  uploadAndAnalyzeDocument, 
  analyzeTextOnly 
} from "../controllers/documentController.js";

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MULTER CONFIGURATION - File Upload Setup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Configure storage location and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store PDFs and images in separate folders for organization
    if (file.mimetype === "application/pdf") {
      cb(null, "uploads/pdfs/");
    } else {
      cb(null, "uploads/images/");
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp + random + original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File validation and size limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Only allow PDF and common image formats
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp"
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: PDF, PNG, JPEG, JPG, GIF, WEBP`));
    }
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/document/analyze
 * Primary endpoint for document upload and analysis
 * 
 * Accepts: multipart/form-data with "document" field
 * Supported files: PDF, PNG, JPEG, JPG, GIF, WEBP
 * Max size: 15MB
 * 
 * Returns: Comprehensive analysis with privacy protection
 */
router.post("/analyze", upload.single("document"), uploadAndAnalyzeDocument);

/**
 * POST /api/document/analyze-text
 * Text-only analysis endpoint (no file upload)
 * 
 * Accepts: JSON with { text: string }
 * Use case: When user pastes text directly
 * 
 * Returns: AI analysis with privacy protection
 */
router.post("/analyze-text", analyzeTextOnly);

/**
 * GET /api/document/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Document analysis service is running",
    timestamp: new Date().toISOString()
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR HANDLING MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Handle multer errors (file size, file type, etc.)
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 15MB limit",
        error: "FILE_TOO_LARGE"
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
      error: "UPLOAD_ERROR"
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: "INVALID_REQUEST"
    });
  }
  next();
});

export default router;
