import fs from "fs";
import { createRequire } from "module";
import { createWorker } from "tesseract.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    const extractedText = pdfData.text.trim();

    if (!extractedText || extractedText.length < 30) {
      throw new Error("PDF appears to be scanned. Use OCR for image-based PDFs.");
    }

    return {
      text: extractedText,
      pages: pdfData.numpages,
      method: "pdf-parse",
    };
  } catch (error) {
    if (error.message?.includes("bad XRef entry") || error.message?.includes("Invalid PDF structure") || error.message?.includes("Password")) {
      throw new Error("The PDF file is corrupted, natively encrypted, or malformed (bad XRef entry). Please open the file in your system, 'Print to PDF' to create a clean copy, and try uploading again.");
    }
    throw error;
  }
}

export async function extractTextFromImage(filePath) {
  const worker = await createWorker("eng");

  try {
    const { data } = await worker.recognize(filePath);
    const extractedText = data.text.trim();

    if (!extractedText || extractedText.length < 20) {
      throw new Error(
        "Unable to extract sufficient text from image. Image may be too blurry or contain no text."
      );
    }

    return {
      text: extractedText,
      confidence: data.confidence,
      method: "tesseract-ocr",
    };
  } finally {
    await worker.terminate();
  }
}

export function cleanupUploadedFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("[fileExtractor] Cleanup failed:", error.message);
    }
  }
}
