// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED DOCUMENT CONTROLLER - Main Entry Point for Document Analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Purpose: Handle document uploads (PDF/Images) and route to analysis pipeline
// Flow: Upload → Extract Text → Comprehensive Analysis → Return Results
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "fs";
import { createRequire } from "module";
import { createWorker } from "tesseract.js";
import { analyzeDocument } from "../services/aiService.js";
import { maskSensitiveData } from "../utils/dataMasking.js";

// PDF parser setup (CommonJS module in ES module project)
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HELPER FUNCTION: Extract Text from PDF
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function extractTextFromPDF(filePath) {
  try {
    console.log("[PDF Extractor] Reading PDF file...");
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    
    const extractedText = pdfData.text.trim();
    
    // Check if PDF is scanned (no extractable text)
    if (!extractedText || extractedText.length < 50) {
      throw new Error("PDF appears to be scanned. Use OCR for image-based PDFs.");
    }
    
    console.log(`[PDF Extractor] ✅ Extracted ${extractedText.length} characters from ${pdfData.numpages} pages`);
    
    return {
      text: extractedText,
      pages: pdfData.numpages,
      method: "pdf-parse"
    };
  } catch (error) {
    console.error("[PDF Extractor] Error:", error.message);
    throw error;
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HELPER FUNCTION: Extract Text from Image (OCR)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function extractTextFromImage(filePath) {
  try {
    console.log("[OCR] Initializing Tesseract worker...");
    const worker = await createWorker("eng");
    
    console.log("[OCR] Recognizing text from image...");
    const { data } = await worker.recognize(filePath);
    
    await worker.terminate();
    
    const extractedText = data.text.trim();
    
    if (!extractedText || extractedText.length < 20) {
      throw new Error("Unable to extract sufficient text from image. Image may be too blurry or contain no text.");
    }
    
    console.log(`[OCR] ✅ Extracted ${extractedText.length} characters (Confidence: ${data.confidence}%)`);
    
    return {
      text: extractedText,
      confidence: data.confidence,
      method: "tesseract-ocr"
    };
  } catch (error) {
    console.error("[OCR] Error:", error.message);
    throw error;
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MAIN ENDPOINT: Upload and Analyze Document
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Route: POST /api/document/analyze
 * Form Data:
 *   - document: File (PDF or Image)
 *   - analysisType: "quick" | "comprehensive" (optional, default: comprehensive)
 * 
 * Complete Processing Pipeline:
 * 1. Validate uploaded file
 * 2. Extract text (PDF-parse or OCR)
 * 3. Mask sensitive data (Privacy Protection)
 * 4. Analyze with Gemini AI
 * 5. Return comprehensive results
 * 6. Clean up uploaded file
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const uploadAndAnalyzeDocument = async (req, res) => {
  let filePath = null;
  
  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📄 NEW DOCUMENT ANALYSIS REQUEST");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: VALIDATE FILE UPLOAD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document uploaded. Please upload a PDF or image file.",
        error: "FILE_MISSING"
      });
    }
    
    filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;
    
    console.log(`[Upload] File: ${fileName}`);
    console.log(`[Upload] Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`[Upload] Type: ${mimeType}`);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: EXTRACT TEXT FROM DOCUMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("\n[Step 1/4] 📝 Extracting text from document...");
    
    let extractionResult;
    let extractedText;
    
    // Determine file type and extract accordingly
    if (mimeType === "application/pdf") {
      extractionResult = await extractTextFromPDF(filePath);
      extractedText = extractionResult.text;
    } else if (mimeType.startsWith("image/")) {
      extractionResult = await extractTextFromImage(filePath);
      extractedText = extractionResult.text;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF or image files.`);
    }
    
    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error("Insufficient text extracted. Document may be empty or unreadable.");
    }
    
    console.log(`[Step 1/4] ✅ Text extraction successful (${extractedText.length} characters)`);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: MASK SENSITIVE DATA (Privacy Protection)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("\n[Step 2/4] 🔒 Protecting sensitive information...");
    
    const maskingResult = maskSensitiveData(extractedText);
    const { maskedText, hasSensitiveData, summary, replacements } = maskingResult;
    
    if (hasSensitiveData) {
      console.log(`[Step 2/4] ✅ Protected ${replacements.length} sensitive fields:`, summary);
    } else {
      console.log("[Step 2/4] ✅ No sensitive data detected");
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: ANALYZE WITH GEMINI AI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("\n[Step 3/4] 🤖 Analyzing document with AI...");
    
    const aiAnalysis = await analyzeDocument(maskedText);
    
    console.log(`[Step 3/4] ✅ AI analysis complete (${aiAnalysis.risks.length} risks identified)`);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: BUILD COMPREHENSIVE RESPONSE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("\n[Step 4/4] 📊 Generating comprehensive report...");
    
    // Calculate risk statistics
    const riskStats = {
      total: aiAnalysis.risks.length,
      high: aiAnalysis.risks.filter(r => r.severity === "HIGH").length,
      medium: aiAnalysis.risks.filter(r => r.severity === "MEDIUM").length,
      low: aiAnalysis.risks.filter(r => r.severity === "LOW").length
    };
    
    // Build final response
    const response = {
      success: true,
      message: "Document analysis completed successfully",
      data: {
        // Document Information
        document: {
          fileName: fileName,
          fileSize: fileSize,
          fileType: mimeType,
          pages: extractionResult.pages || 1,
          extractionMethod: extractionResult.method,
          textLength: extractedText.length,
          confidence: extractionResult.confidence || null
        },
        
        // Privacy Protection
        privacy: {
          protected: hasSensitiveData,
          fieldsProtected: replacements.length,
          dataTypes: Object.keys(summary),
          summary: summary
        },
        
        // AI Analysis Results
        analysis: {
          summary: aiAnalysis.summary,
          risks: aiAnalysis.risks,
          riskStatistics: riskStats,
          chunksProcessed: aiAnalysis.chunksProcessed
        },
        
        // Processing Metadata
        metadata: {
          processedAt: new Date().toISOString(),
          processingSteps: [
            "✅ Text extraction",
            "✅ Privacy protection",
            "✅ AI analysis",
            "✅ Report generation"
          ]
        }
      }
    };
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: CLEANUP AND SEND RESPONSE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // Delete uploaded file (privacy + storage management)
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("[Cleanup] ✅ Uploaded file deleted for privacy");
    }
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ ANALYSIS COMPLETE");
    console.log(`   Risks Found: ${riskStats.total} (${riskStats.high} High, ${riskStats.medium} Medium, ${riskStats.low} Low)`);
    console.log(`   Privacy: ${hasSensitiveData ? replacements.length + " fields protected" : "No sensitive data"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error("\n❌ ERROR DURING DOCUMENT ANALYSIS:", error.message);
    
    // Cleanup on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("[Cleanup] File deleted after error");
      } catch (cleanupError) {
        console.error("[Cleanup] Failed to delete file:", cleanupError.message);
      }
    }
    
    // Determine appropriate HTTP status code
    let statusCode = 500;
    let errorType = "PROCESSING_ERROR";
    
    if (error.message.includes("Unsupported file type")) {
      statusCode = 400;
      errorType = "INVALID_FILE_TYPE";
    } else if (error.message.includes("Insufficient text")) {
      statusCode = 400;
      errorType = "INSUFFICIENT_TEXT";
    } else if (error.message.includes("Gemini") || error.message.includes("API")) {
      statusCode = 503;
      errorType = "AI_SERVICE_ERROR";
    } else if (error.message.includes("scanned")) {
      statusCode = 400;
      errorType = "SCANNED_PDF";
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Document analysis failed",
      error: errorType,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * QUICK TEXT ANALYSIS ENDPOINT (No File Upload)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Route: POST /api/document/analyze-text
 * Body: { text: string }
 * 
 * Use case: When user pastes text directly instead of uploading file
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const analyzeTextOnly = async (req, res) => {
  try {
    const { text } = req.body;
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 TEXT-ONLY ANALYSIS REQUEST");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Text is required for analysis",
        error: "TEXT_MISSING"
      });
    }
    
    if (text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: "Text is too short. Please provide at least 50 characters.",
        error: "TEXT_TOO_SHORT"
      });
    }
    
    console.log(`[Input] Text length: ${text.length} characters`);
    
    // Mask sensitive data
    console.log("\n[Step 1/2] 🔒 Protecting sensitive information...");
    const maskingResult = maskSensitiveData(text);
    const { maskedText, hasSensitiveData, summary, replacements } = maskingResult;
    
    if (hasSensitiveData) {
      console.log(`[Step 1/2] ✅ Protected ${replacements.length} sensitive fields`);
    }
    
    // Analyze with AI
    console.log("\n[Step 2/2] 🤖 Analyzing text with AI...");
    const aiAnalysis = await analyzeDocument(maskedText);
    
    // Calculate statistics
    const riskStats = {
      total: aiAnalysis.risks.length,
      high: aiAnalysis.risks.filter(r => r.severity === "HIGH").length,
      medium: aiAnalysis.risks.filter(r => r.severity === "MEDIUM").length,
      low: aiAnalysis.risks.filter(r => r.severity === "LOW").length
    };
    
    console.log(`\n✅ Analysis complete: ${riskStats.total} risks found\n`);
    
    return res.status(200).json({
      success: true,
      message: "Text analysis completed successfully",
      data: {
        privacy: {
          protected: hasSensitiveData,
          fieldsProtected: replacements.length,
          summary: summary
        },
        analysis: {
          summary: aiAnalysis.summary,
          risks: aiAnalysis.risks,
          riskStatistics: riskStats
        },
        metadata: {
          processedAt: new Date().toISOString(),
          textLength: text.length
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Text analysis error:", error.message);
    
    return res.status(500).json({
      success: false,
      message: error.message || "Text analysis failed",
      error: "ANALYSIS_ERROR"
    });
  }
};
