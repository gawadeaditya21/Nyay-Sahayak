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
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeDocument } from "../services/aiService.js";

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
 * New endpoint: Analyze document using Gemini AI
 * Accepts extracted document text and returns AI-powered analysis
 * Route: POST /api/analyze-with-gemini
 * Body: { documentText: string }
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
    const analysis = await analyzeDocument(documentText);

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