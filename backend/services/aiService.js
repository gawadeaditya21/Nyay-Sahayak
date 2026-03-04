// services/aiService.js
// Core AI service that handles Gemini API integration
// Includes text chunking, JSON parsing, and error handling

import { geminiModel } from "../config/gemini.js";

// Maximum characters per chunk to avoid exceeding API limits
// Legal documents can be very large
const MAX_CHUNK_SIZE = 10000;

/**
 * Split large text into smaller chunks
 * Prevents API errors when document exceeds token limits
 * @param {string} text - Full document text
 * @param {number} chunkSize - Characters per chunk (default: 10000)
 * @returns {Array} Array of text chunks
 */
function chunkText(text, chunkSize = MAX_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Remove markdown formatting from Gemini response
 * Gemini sometimes wraps JSON in ```json ... ``` blocks
 * @param {string} text - Raw response from Gemini
 * @returns {string} Clean text without markdown
 */
function removeMarkdownFormatting(text) {
  // Remove ```json and ``` wrappers if present
  let cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return cleaned;
}

/**
 * Safely parse JSON response from Gemini
 * Handles cases where response might contain extra text
 * @param {string} responseText - Raw response text
 * @returns {Object} Parsed JSON object
 * @throws {Error} If JSON cannot be parsed
 */
function parseJSONResponse(responseText) {
  try {
    // Try direct parsing first
    return JSON.parse(responseText);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from text
    // This handles cases where Gemini includes explanatory text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        throw new Error("Extracted JSON still invalid: " + innerError.message);
      }
    }
    throw new Error("No valid JSON found in Gemini response");
  }
}

/**
 * Send text chunk to Gemini and get analysis
 * Uses structured prompt to force JSON output
 * @param {string} textChunk - Document text to analyze
 * @returns {Promise<Object>} Analysis result with summary and risks
 */
async function analyzeTextChunk(textChunk) {
  // Structured prompt that forces Gemini to return JSON
  const prompt = `
You are a legal document analyzer. Analyze the following legal document and extract key information.

Return ONLY valid JSON in this exact format. Do not include any other text:
{
  "summary": "Brief 2-3 sentence summary of the key points in this document",
  "risks": [
    {
      "clause": "Specific clause number or section title",
      "severity": "LOW|MEDIUM|HIGH",
      "reason": "Detailed explanation of why this clause is risky"
    }
  ]
}

If there are no risks, return an empty risks array: "risks": []

Document text to analyze:
${textChunk}

Return only the JSON object. No markdown, no code blocks, just JSON.
`;

  try {
    // Send request to Gemini API
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    console.log("[aiService] Raw Gemini response received");

    // Clean markdown formatting (remove ```json ``` wrappers)
    const cleanedText = removeMarkdownFormatting(responseText);

    // Safely parse JSON response
    const parsedResponse = parseJSONResponse(cleanedText);

    // Validate response structure
    if (!parsedResponse.summary || !Array.isArray(parsedResponse.risks)) {
      throw new Error("Invalid response structure from Gemini");
    }

    return parsedResponse;
  } catch (error) {
    console.error("[aiService] Error analyzing text chunk:", error.message);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Main function: Analyze complete document using Gemini
 * Handles large documents by chunking them
 * Combines results from all chunks
 * @param {string} documentText - Full extracted document text (from OCR)
 * @returns {Promise<Object>} Combined analysis result with summary and risks
 */
async function analyzeDocument(documentText) {
  // Validate input
  if (!documentText || documentText.trim().length === 0) {
    throw new Error("Document text cannot be empty");
  }

  try {
    // Split document into chunks if it's too large
    const chunks = chunkText(documentText);
    console.log(
      `[aiService] Analyzing document with ${chunks.length} chunk(s)...`
    );

    // Analyze first chunk (usually contains most important info)
    const firstChunkAnalysis = await analyzeTextChunk(chunks[0]);

    // Combine risks from all chunks if multiple chunks exist
    let allRisks = [...firstChunkAnalysis.risks];

    // Process remaining chunks
    for (let i = 1; i < chunks.length; i++) {
      console.log(`[aiService] Processing chunk ${i + 1}/${chunks.length}...`);
      const chunkAnalysis = await analyzeTextChunk(chunks[i]);
      // Merge risks from this chunk with previous risks
      allRisks = [...allRisks, ...chunkAnalysis.risks];
    }

    // Remove duplicate risks (optional - adjust as needed)
    const uniqueRisks = allRisks.filter(
      (risk, index, self) =>
        index ===
        self.findIndex(
          (r) => r.clause === risk.clause && r.severity === risk.severity
        )
    );

    // Return combined analysis result
    const result = {
      summary: firstChunkAnalysis.summary,
      risks: uniqueRisks,
      chunksProcessed: chunks.length,
      totalRisksFound: uniqueRisks.length,
    };

    console.log(
      `[aiService] Analysis complete. Found ${uniqueRisks.length} unique risks.`
    );

    return result;
  } catch (error) {
    console.error("[aiService] Error in analyzeDocument:", error.message);
    throw error;
  }
}

export { analyzeDocument, analyzeTextChunk, chunkText, parseJSONResponse };
