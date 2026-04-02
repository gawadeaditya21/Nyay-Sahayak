// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API SERVICE - Centralized API communication layer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Purpose: Handle all backend API calls with proper error handling
// Benefits: 
//   - Single source of truth for API endpoints
//   - Consistent error handling
//   - Easy to maintain and test
//   - Type-safe responses
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// API endpoints
const ENDPOINTS = {
  DOCUMENT_ANALYZE: `${API_BASE_URL}/document/analyze`,
  TEXT_ANALYZE: `${API_BASE_URL}/document/analyze-text`,
  HEALTH_CHECK: `${API_BASE_URL}/document/health`,
  CHAT: `${API_BASE_URL}/chat`,
  FIR_GENERATE: `${API_BASE_URL}/generate-fir`,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Handle API response with consistent error handling
 * @param {Response} response - Fetch API response object
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If response is not ok
 */
async function handleResponse(response) {
  // Parse JSON response
  const data = await response.json();
  
  // If response is not successful, throw error with details
  if (!response.ok) {
    const error = new Error(data.message || "API request failed");
    error.status = response.status;
    error.code = data.error || "UNKNOWN_ERROR";
    error.details = data.details;
    throw error;
  }
  
  return data;
}

/**
 * Format error message for user display
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
function formatErrorMessage(error) {
  // Network errors
  if (error.message === "Failed to fetch") {
    return "Unable to connect to server. Please check if the backend is running.";
  }
  
  // Custom error codes
  switch (error.code) {
    case "FILE_MISSING":
      return "Please select a document to upload.";
    case "FILE_TOO_LARGE":
      return "File size exceeds 15MB limit. Please upload a smaller file.";
    case "INVALID_FILE_TYPE":
      return "Invalid file type. Please upload a PDF or image file.";
    case "INSUFFICIENT_TEXT":
      return "Unable to extract sufficient text from the document. Please try a different file.";
    case "AI_SERVICE_ERROR":
      return "AI analysis service is temporarily unavailable. Please try again later.";
    case "TEXT_TOO_SHORT":
      return "Text is too short for analysis. Please provide at least 50 characters.";
    case "SCANNED_PDF":
      return "This appears to be a scanned PDF. Please upload an image version for OCR processing.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Upload and analyze a document (PDF or image)
 * 
 * @param {File} file - File object from input
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Analysis results
 * 
 * @example
 * const result = await analyzeDocument(file);
 * console.log(result.data.analysis.summary);
 */
export async function analyzeDocument(file, onProgress = null) {
  try {
    // Validate file
    if (!file) {
      throw new Error("No file provided");
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append("document", file);
    
    // Optional: Report upload start
    if (onProgress) {
      onProgress({ stage: "uploading", progress: 0 });
    }
    
    // Send request
    const response = await fetch(ENDPOINTS.DOCUMENT_ANALYZE, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });
    
    // Handle response
    const data = await handleResponse(response);
    
    // Report completion
    if (onProgress) {
      onProgress({ stage: "completed", progress: 100 });
    }
    
    return data;
    
  } catch (error) {
    console.error("[API] Document analysis error:", error);
    
    // Format error for user display
    const userMessage = formatErrorMessage(error);
    
    // Re-throw with formatted message
    const formattedError = new Error(userMessage);
    formattedError.originalError = error;
    formattedError.code = error.code;
    
    throw formattedError;
  }
}

/**
 * Analyze text directly without file upload
 * 
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Analysis results
 * 
 * @example
 * const result = await analyzeText("This is my legal document text...");
 * console.log(result.data.analysis.risks);
 */
export async function analyzeText(text) {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }
    
    if (text.trim().length < 5) {
      throw new Error("Text is too short. Please provide at least 5 characters.");
    }
    
    // Send request
    const response = await fetch(ENDPOINTS.TEXT_ANALYZE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    
    // Handle response
    const data = await handleResponse(response);
    
    return data;
    
  } catch (error) {
    console.error("[API] Text analysis error:", error);
    
    // Format error for user display
    const userMessage = formatErrorMessage(error);
    
    // Re-throw with formatted message
    const formattedError = new Error(userMessage);
    formattedError.originalError = error;
    formattedError.code = error.code;
    
    throw formattedError;
  }
}

/**
 * Check API health status
 * 
 * @returns {Promise<Object>} Health status
 * 
 * @example
 * const status = await checkHealth();
 * if (status.success) console.log("API is healthy");
 */
export async function checkHealth() {
  try {
    const response = await fetch(ENDPOINTS.HEALTH_CHECK, {
      method: "GET",
    });
    
    const data = await handleResponse(response);
    
    return data;
    
  } catch (error) {
    console.error("[API] Health check error:", error);
    throw error;
  }
}

/**
 * Generate FIR / complaint draft
 *
 * @param {string} userInput - Problem description
 * @returns {Promise<Object>} FIR draft
 */
export async function generateFir(userInput) {
  try {
    if (!userInput || !userInput.trim()) {
      throw new Error("User input cannot be empty");
    }

    const response = await fetch(ENDPOINTS.FIR_GENERATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_input: userInput.trim() }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("[API] FIR generation error:", error);
    const userMessage = formatErrorMessage(error);
    const formattedError = new Error(userMessage);
    formattedError.originalError = error;
    formattedError.code = error.code;
    throw formattedError;
  }
}

export async function sendChatMessage(message) {
  try {
    if (!message || !message.trim()) {
      throw new Error("Message cannot be empty");
    }

    const response = await fetch(ENDPOINTS.CHAT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message.trim() }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("[API] Chat error:", error);

    const userMessage = formatErrorMessage(error);
    const formattedError = new Error(userMessage);
    formattedError.originalError = error;
    formattedError.code = error.code;

    throw formattedError;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT DEFAULT API OBJECT (Alternative usage pattern)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const api = {
  analyzeDocument,
  analyzeText,
  checkHealth,
  sendChatMessage,
};

export default api;
