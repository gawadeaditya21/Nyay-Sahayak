// import { spawn } from "child_process";
// import path from "path";
// import { fileURLToPath } from "url";

// // Fix for __dirname in ES module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const analyseText = (req, res) => {
//   const { text } = req.body;

//   if (!text) {
//     return res.status(400).json({ error: "Text required" });
//   }

//   const pythonPath = path.join(
//     __dirname,
//     "../../ml-service/test_search.py"
//   );

//   const pythonProcess = spawn("python", [pythonPath, text]);

//   let output = "";

//   pythonProcess.stdout.on("data", (data) => {
//     output += data.toString();
//   });

//   pythonProcess.stderr.on("data", (data) => {
//     console.error("Python error:", data.toString());
//   });

//   pythonProcess.on("close", () => {
//     try {
//       const parsed = JSON.parse(output);
//       res.json(parsed);
//     } catch (err) {
//       res.status(500).json({ error: "Invalid Python response" });
//     }
//   });
// };
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYSIS CONTROLLER - Legal Document Analysis Endpoints
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Purpose: Handle document analysis requests with multiple methods:
//   1. Dataset-based analysis (TF-IDF + Cosine Similarity)
//   2. Gemini AI analysis (Intelligent risk assessment)
//   3. Comprehensive analysis (Dataset + Gemini + Privacy Protection)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeDocument } from "../services/aiService.js";
import { maskSensitiveData } from "../utils/dataMasking.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Original ML analysis endpoint (using Python)
export const analyseText = (req, res) => {
  const { text } = req.body;

  console.log("Received text from frontend:", text);

  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }

  const pythonPath = path.join(
    __dirname,
    "../../ml-service/test_search.py"
  );

  console.log("Python file path:", pythonPath);

  const pythonProcess = spawn("python", [pythonPath, text]);

  let output = "";

  pythonProcess.stdout.on("data", (data) => {
    console.log("Python STDOUT:", data.toString());
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Python STDERR:", data.toString());
  });

  pythonProcess.on("close", (code) => {
    console.log("Python process exited with code:", code);
    console.log("Final Output:", output);

    // try {
    //   const parsed = JSON.parse(output);
    //   res.json(parsed);
    // } catch (err) {
    //   console.error("JSON Parse Error:", err);
    //   res.status(500).json({ error: "Invalid Python response" });
    // }
  });
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ENDPOINT 2: Gemini AI Analysis (Intelligent Risk Assessment)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Route: POST /api/analyze-with-gemini
 * Body: { documentText: string }
 * 
 * This endpoint uses Google's Gemini AI to analyze legal documents
 * and identify potential risks, unfavorable clauses, and provide summary.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const analyzeWithGemini = async (req, res) => {
  try {
    const { documentText } = req.body;

    console.log("[Controller] Received analysis request with text length:", documentText?.length);

    // Validate input
    if (!documentText || documentText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Document text is required",
        error: "documentText field missing or empty",
      });
    }

    // Call AI service to analyze document with Gemini
    // This is where the magic happens - Gemini analyzes the document
    console.log("[Controller] Calling Gemini AI service...");
    const analysis = await analyzeDocument(documentText, {
      detectionText: documentText,
      rawText: documentText,
    });

    console.log("[Controller] Analysis complete. Sending response...");

    // Return analysis result to frontend
    return res.status(200).json({
      success: true,
      data: analysis,
      message: "Document analysis completed successfully",
    });
  } catch (error) {
    console.error("[Controller] Analysis error:", error.message);

    // Return error response
    const statusCode =
      error.message.includes("API") || error.message.includes("Gemini")
        ? 503
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to analyze document",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ENDPOINT 3: Comprehensive Analysis (Complete Flow)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Route: POST /api/comprehensive-analysis
 * Body: { documentText: string }
 * 
 * COMPLETE FLOW:
 * 1. Mask sensitive data (Aadhaar, PAN, Phone, Email, Names)
 * 2. Check dataset for similar documents (TF-IDF + Cosine Similarity)
 * 3. Send masked text to Gemini AI for intelligent analysis
 * 4. Combine all results into comprehensive report
 * 5. Return to frontend with privacy info + dataset match + AI insights
 * 
 * This is the RECOMMENDED endpoint for production use.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const comprehensiveAnalysis = async (req, res) => {
  try {
    const { documentText } = req.body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VALIDATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!documentText || documentText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Document text is required",
        error: "documentText field is missing or empty"
      });
    }

    console.log("[Comprehensive] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[Comprehensive] Starting comprehensive analysis...");
    console.log("[Comprehensive] Document size:", documentText.length, "characters");
    console.log("[Comprehensive] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: MASK SENSITIVE DATA (Privacy Protection)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("[Step 1/4] 🔒 Masking sensitive data...");
    const maskingResult = maskSensitiveData(documentText);
    const { maskedText, replacements, hasSensitiveData, summary } = maskingResult;

    if (hasSensitiveData) {
      console.log(`[Step 1/4] ✅ Masked ${replacements.length} sensitive fields:`, summary);
    } else {
      console.log("[Step 1/4] ✅ No sensitive data detected");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: DATASET CHECK (TF-IDF + Cosine Similarity)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("[Step 2/4] 📊 Checking dataset for similar documents...");

    // Call Python ML service for dataset analysis
    const datasetResult = await callPythonMLService(maskedText);

    console.log(`[Step 2/4] ✅ Dataset analysis complete`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: GEMINI AI ANALYSIS (Intelligent Risk Assessment)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("[Step 3/4] 🤖 Sending to Gemini AI for deep analysis...");

    const geminiAnalysis = await analyzeDocument(maskedText, {
      detectionText: documentText,
      rawText: documentText,
    });

    console.log(`[Step 3/4] ✅ Gemini identified ${geminiAnalysis.risks.length} risks`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: COMBINE RESULTS INTO COMPREHENSIVE REPORT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("[Step 4/4] 📋 Generating comprehensive report...");

    // Calculate risk severity distribution
    const riskDistribution = {
      high: geminiAnalysis.risks.filter(r => r.severity === 'HIGH').length,
      medium: geminiAnalysis.risks.filter(r => r.severity === 'MEDIUM').length,
      low: geminiAnalysis.risks.filter(r => r.severity === 'LOW').length,
    };

    // Build comprehensive report
    const comprehensiveReport = {
      // Privacy Protection Information
      privacy: {
        protected: hasSensitiveData,
        totalFieldsMasked: replacements.length,
        maskedDataTypes: Object.keys(summary),
        summary: summary,
        message: hasSensitiveData 
          ? `✅ ${replacements.length} sensitive field(s) protected` 
          : "ℹ️ No sensitive data detected"
      },

      // Dataset Analysis (Document Type Identification)
      datasetAnalysis: {
        similarDocuments: datasetResult.results || [],
        topMatch: datasetResult.results && datasetResult.results.length > 0 
          ? datasetResult.results[0] 
          : null,
        confidence: datasetResult.results && datasetResult.results.length > 0 
          ? datasetResult.results[0].similarity || 0 
          : 0,
        message: datasetResult.results && datasetResult.results.length > 0
          ? `Found ${datasetResult.results.length} similar document(s) in database`
          : "No similar documents found in database"
      },

      // Gemini AI Analysis (Risk Assessment)
      aiAnalysis: {
        summary: geminiAnalysis.summary,
        risks: geminiAnalysis.risks,
        riskDistribution: riskDistribution,
        totalRisks: geminiAnalysis.risks.length,
        chunksProcessed: geminiAnalysis.chunksProcessed || 1,
        message: geminiAnalysis.risks.length > 0
          ? `⚠️ Identified ${geminiAnalysis.risks.length} potential risk(s)`
          : "✅ No significant risks detected"
      },

      // Processing Metadata
      metadata: {
        processingSteps: [
          "✅ Step 1: Data masking completed",
          "✅ Step 2: Dataset analysis completed", 
          "✅ Step 3: AI analysis completed",
          "✅ Step 4: Report generation completed"
        ],
        documentSize: documentText.length,
        maskedDocumentSize: maskedText.length,
        timestamp: new Date().toISOString(),
        processingVersion: "v1.0.0"
      }
    };

    console.log("[Comprehensive] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[Comprehensive] ✅ Analysis complete!");
    console.log("[Comprehensive] Privacy:", hasSensitiveData ? `${replacements.length} fields masked` : "No sensitive data");
    console.log("[Comprehensive] Dataset:", datasetResult.results?.length || 0, "matches");
    console.log("[Comprehensive] AI Risks:", geminiAnalysis.risks.length);
    console.log("[Comprehensive] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Return comprehensive report
    return res.status(200).json({
      success: true,
      data: comprehensiveReport,
      message: "Comprehensive analysis completed successfully"
    });

  } catch (error) {
    console.error("[Comprehensive] ❌ Error:", error.message);
    console.error("[Comprehensive] Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Comprehensive analysis failed",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HELPER FUNCTION: Call Python ML Service
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * This function spawns a Python process to run TF-IDF analysis
 * using the existing ml-service/test_search.py script.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function callPythonMLService(text) {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(__dirname, "../../ml-service/test_search.py");

    console.log("[ML Service] Spawning Python process:", pythonPath);

    const pythonProcess = spawn("python", [pythonPath, text]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error("[ML Service] Python stderr:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      console.log("[ML Service] Python process exited with code:", code);

      if (code !== 0) {
        console.error("[ML Service] Error output:", errorOutput);
        // Return empty result instead of rejecting
        resolve({
          results: [],
          message: "ML service unavailable or failed"
        });
        return;
      }

      try {
        const parsed = JSON.parse(output);
        resolve(parsed);
      } catch (err) {
        console.error("[ML Service] JSON Parse Error:", err.message);
        // Return empty result instead of rejecting
        resolve({
          results: [],
          message: "Failed to parse ML service response"
        });
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("[ML Service] Process error:", err.message);
      // Return empty result instead of rejecting
      resolve({
        results: [],
        message: "Failed to start ML service"
      });
    });
  });
}